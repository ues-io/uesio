package dynamodb

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

func followUpReferenceFieldLoad(
	ctx context.Context,
	client *dynamodb.DynamoDB,
	metadata *adapters.MetadataCache,
	dataPayload []map[string]interface{},
	originalCollection *adapters.CollectionMetadata,
	foreignKeyValues adapters.ReferenceIDRegistry,
	referenceFields adapters.FieldsMap,
) error {

	referencedCollectionsFields, referencedCollectionsIDs, err := adapters.GetReferenceFieldsAndIDs(referenceFields, metadata, foreignKeyValues)
	if err != nil {
		return err
	}

	for collectionName, fields := range referencedCollectionsFields {
		ids := referencedCollectionsIDs.GetKeys(collectionName)
		collectionMetadata, err := metadata.GetCollection(collectionName)
		if err != nil {
			return err
		}
		DynamoDBCollectionName, err := getDBCollectionName(collectionMetadata)
		if err != nil {
			return err
		}

		var IDFieldMetadata = collectionMetadata.Fields[collectionMetadata.IDField]
		IDField, err := getDBFieldName(IDFieldMetadata)
		if err != nil {
			return err
		}

		var Cond expression.ConditionBuilder

		if len(ids) > 0 {
			for i, id := range ids {
				if i == 0 {
					Cond = expression.Name(IDField).Equal(expression.Value(id))
				} else {
					Cond = Cond.Or(expression.Name(IDField).Equal(expression.Value(id)))
				}
			}
		}

		keyCond := expression.Key(SystemCollectionID).Equal(expression.Value(DynamoDBCollectionName))

		expr, err := expression.NewBuilder().
			WithFilter(Cond).
			WithKeyCondition(keyCond).
			Build()
		if err != nil {
			fmt.Println(err)
		}

		input := &dynamodb.QueryInput{
			KeyConditionExpression:    expr.KeyCondition(),
			IndexName:                 aws.String(SystemIndex),
			TableName:                 aws.String(SystemTable),
			ExpressionAttributeNames:  expr.Names(),
			ExpressionAttributeValues: expr.Values(),
			FilterExpression:          expr.Filter(),
			ProjectionExpression:      expr.Projection(),
		}

		result, err := client.Query(input)
		if err != nil {
			return err
		}

		idToDataMapping := make(map[string]map[string]interface{})

		IDFieldUIName, err := adapters.GetUIFieldName(IDFieldMetadata)
		if err != nil {
			return err
		}

		for _, lmap := range result.Items {

			wireDataParsed := make(map[string]interface{})

			for field := range fields {

				var i interface{}

				fieldMetadata, err := collectionMetadata.GetField(field)
				if err != nil {
					return err
				}

				fieldID, err := adapters.GetUIFieldName(fieldMetadata)
				if err != nil {
					return err
				}

				dynamoFieldName, err := getDBFieldName(fieldMetadata)
				if err != nil {
					return err
				}

				value, ok := lmap[dynamoFieldName]
				if !ok {
					continue
				}
				dynamodbattribute.Unmarshal(value, &i)
				wireDataParsed[fieldID] = i
			}

			testid := wireDataParsed[IDFieldUIName].(string)
			idToDataMapping[testid] = wireDataParsed
		}

		adapters.MergeReferenceData(dataPayload, referenceFields, idToDataMapping, collectionMetadata)
	}

	return nil
}
