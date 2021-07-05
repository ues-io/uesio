package dynamodbmultipleV2

import (
	"context"
	"errors"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Adapter struct
type Adapter struct {
}

func getDynamoDB(dbcreds *adapt.Credentials) (*dynamodb.Client, error) {
	// Using the SDK's default configuration, loading additional config
	// and credentials values from the environment variables, shared
	// credentials, and shared configuration files
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("eu-west-1"))
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	// Using the Config value, create the DynamoDB client
	svc := dynamodb.NewFromConfig(cfg)

	return svc, nil
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

func describeTableDynamoDB(ctx context.Context, tableName string, client *dynamodb.Client) (bool, error) {

	//TO-DO Not sure about GlobalTableNotFoundException there are so many new types
	// https://pkg.go.dev/github.com/aws/aws-sdk-go-v2/service/dynamodb@v1.4.0/types#ExportNotFoundException
	var nfe *types.GlobalTableNotFoundException

	input := &dynamodb.DescribeTableInput{
		TableName: aws.String(tableName),
	}

	_, err := client.DescribeTable(ctx, input)

	if errors.As(err, &nfe) {
		return true, nil
	}

	return false, err

}

func createTableDynamoDB(ctx context.Context, tableName string, idFieldName string, client *dynamodb.Client) error {

	input := &dynamodb.CreateTableInput{
		AttributeDefinitions: []types.AttributeDefinition{
			{
				AttributeName: aws.String(idFieldName),
				AttributeType: types.ScalarAttributeTypeS,
			},
		},
		KeySchema: []types.KeySchemaElement{
			{
				AttributeName: aws.String(idFieldName),
				KeyType:       types.KeyTypeHash,
			},
		},
		// ProvisionedThroughput: &dynamodb.ProvisionedThroughput{
		// 	ReadCapacityUnits:  aws.Int64(5),
		// 	WriteCapacityUnits: aws.Int64(5),
		// },
		TableName: aws.String(tableName),
	}

	_, err := client.CreateTable(ctx, input)

	if err != nil {
		return err
	}

	return nil
}
