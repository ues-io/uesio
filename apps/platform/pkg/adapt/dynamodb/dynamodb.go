package dynamodb

import (
	"errors"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Adapter struct
type Adapter struct {
}

// System variables DynamoDB
var (
	SystemTable        string
	SystemIndex        string
	SystemID           string
	SystemCollectionID string
	SystemSetUp        error
)

func getSystemID(collectionName string, ID string) string {
	return collectionName + ":" + ID
}

func init() {
	SystemSetUp = InitSystemEnv()
}

//InitSystemEnv inits System variables for DynamoDB
func InitSystemEnv() error {

	val, ok := os.LookupEnv("DYDB_TABLE_NAME")
	if !ok {
		return errors.New("Could not get environment variable: DYDB_TABLE_NAME")
	}
	SystemTable = val

	val, ok = os.LookupEnv("DYDB_TABLE_GSI_NAME")
	if !ok {
		return errors.New("Could not get environment variable: DYDB_TABLE_GSI_NAME")
	}
	SystemIndex = val

	val, ok = os.LookupEnv("DYDB_RECORD_ID_NAME")
	if !ok {
		return errors.New("Could not get environment variable: DYDB_RECORD_ID_NAME")
	}

	SystemID = val

	val, ok = os.LookupEnv("DYDB_RECORD_COLLECTION_ID_NAME")
	if !ok {
		return errors.New("Could not get environment variable: DYDB_RECORD_COLLECTION_ID_NAME")
	}

	SystemCollectionID = val

	return nil

}

func getDynamoDB(dbcreds *adapt.Credentials) *dynamodb.DynamoDB {

	sess, _ := session.NewSession(&aws.Config{
		Region:      aws.String(dbcreds.Region),
		Credentials: credentials.NewStaticCredentials(dbcreds.Username, dbcreds.Password, ""),
	})

	svc := dynamodb.New(sess)
	return svc
}

func getDBFieldName(fieldMetadata *adapt.FieldMetadata) (string, error) {
	if fieldMetadata.Namespace == "" || fieldMetadata.PropertyName == "" {
		return "", errors.New("Could not get DB Field Name: Missing important field metadata: " + fieldMetadata.Name)
	}
	return fieldMetadata.Namespace + ":" + fieldMetadata.PropertyName, nil
}

func getDBCollectionName(collectionMetadata *adapt.CollectionMetadata) (string, error) {
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
