package dynamodbmultiple

import (
	"errors"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/creds"
)

// Adapter struct
type Adapter struct {
}

func getDynamoDB(dbcreds *creds.AdapterCredentials) *dynamodb.DynamoDB {

	sess, _ := session.NewSession(&aws.Config{
		Region:      aws.String(dbcreds.Region),
		Credentials: credentials.NewStaticCredentials(dbcreds.Username, dbcreds.Password, ""),
	})

	svc := dynamodb.New(sess)
	return svc
}

func getDBFieldName(fieldMetadata *adapters.FieldMetadata) (string, error) {
	if fieldMetadata.Namespace == "" || fieldMetadata.PropertyName == "" {
		return "", errors.New("Could not get DB Field Name: Missing important field metadata: " + fieldMetadata.Name)
	}
	return fieldMetadata.Namespace + ":" + fieldMetadata.PropertyName, nil
}

func getDBCollectionName(collectionMetadata *adapters.CollectionMetadata) (string, error) {
	if collectionMetadata.Namespace == "" || collectionMetadata.CollectionName == "" {
		return "", errors.New("Could not get DB Collection Name: Missing important collection metadata: " + collectionMetadata.Name)
	}
	return collectionMetadata.Namespace + "." + collectionMetadata.CollectionName, nil
}

func getExpressionUpdate(requestedFields map[string]*dynamodb.AttributeValue) (expression.Expression, error) {

	update := expression.UpdateBuilder{}

	for name, value := range requestedFields {
		update = update.Set(expression.Name(name), expression.Value(value))
	}

	expr, err := expression.NewBuilder().
		WithUpdate(update).
		Build()

	return expr, err

}

// This functions maps DBname into UIname
func manageResponse(result *dynamodb.ScanOutput, requestedFields adapters.FieldsMap, referenceCollection adapters.ReferenceRegistry, collectionMetadata *adapters.CollectionMetadata) ([]map[string]interface{}, error) {
	wireData := make([]map[string]interface{}, 0)

	for _, lmap := range result.Items {

		wireDataParsed := make(map[string]interface{})

		// Map properties from firestore to uesio fields
		for _, fieldMetadata := range requestedFields {

			var i interface{}

			fieldID, err := adapters.GetUIFieldName(fieldMetadata)
			if err != nil {
				return nil, err
			}

			dynamoFieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return nil, err
			}

			value, ok := lmap[dynamoFieldName]
			if !ok {
				continue
			}
			dynamodbattribute.Unmarshal(value, &i)
			wireDataParsed[fieldID] = i

		}

		for _, reference := range referenceCollection {
			fieldMetadata := reference.Metadata
			foreignKeyMetadata, err := collectionMetadata.GetField(fieldMetadata.ForeignKeyField)
			if err != nil {
				return nil, errors.New("foreign key: " + fieldMetadata.ForeignKeyField + " configured for: " + fieldMetadata.Name + " does not exist in collection: " + collectionMetadata.Name)
			}
			foreignKeyName, err := adapters.GetUIFieldName(foreignKeyMetadata)
			if err != nil {
				return nil, err
			}

			foreignKeyValue, ok := wireDataParsed[foreignKeyName]
			if !ok {
				//No foreign key value
				continue
			}

			reference.AddID(foreignKeyValue)
		}

		wireData = append(wireData, wireDataParsed)
	}

	return wireData, nil
}

func describeTableDynamoDB(tableName string, client *dynamodb.DynamoDB) (bool, error) {

	input := &dynamodb.DescribeTableInput{
		TableName: aws.String(tableName),
	}

	_, err := client.DescribeTable(input)
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok {
			switch aerr.Code() {
			case dynamodb.ErrCodeResourceNotFoundException:
				return true, nil
			case dynamodb.ErrCodeInternalServerError:
				return false, err
			default:
				return false, err
			}
		}
	}

	return false, err

}

func createTableDynamoDB(tableName string, idFieldName string, client *dynamodb.DynamoDB) error {

	input := &dynamodb.CreateTableInput{
		AttributeDefinitions: []*dynamodb.AttributeDefinition{
			{
				AttributeName: aws.String(idFieldName),
				AttributeType: aws.String("S"),
			},
		},
		KeySchema: []*dynamodb.KeySchemaElement{
			{
				AttributeName: aws.String(idFieldName),
				KeyType:       aws.String("HASH"),
			},
		},
		ProvisionedThroughput: &dynamodb.ProvisionedThroughput{
			ReadCapacityUnits:  aws.Int64(5),
			WriteCapacityUnits: aws.Int64(5),
		},
		TableName: aws.String(tableName),
	}

	_, err := client.CreateTable(input)

	if err != nil {
		return err
	}

	return nil
}
