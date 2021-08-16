package dynamodb

import (
	"context"
	"errors"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Save function
func (a *Adapter) Save(requests []adapt.SaveOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {

	ctx := context.Background()
	client, err := getDynamoDB(ctx, credentials)
	if err != nil {
		return err
	}

	if SystemSetUp != nil {
		return SystemSetUp
	}

	tenantID := credentials.GetTenantID()

	for _, request := range requests {

		collectionMetadata, err := metadata.GetCollection(request.CollectionName)
		if err != nil {
			return err
		}

		collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
		if err != nil {
			return err
		}

		idFieldMetadata, err := collectionMetadata.GetIDField()
		if err != nil {
			return err
		}

		idFieldDBName, err := getDBFieldName(idFieldMetadata)
		if err != nil {
			return err
		}

		// Sometimes we only have the name of something instead of its real id
		// We can use this lookup functionality to get the real id before the save.
		err = adapt.HandleLookups(func(ops []adapt.LoadOp) error {
			return loadMany(ctx, client, ops, metadata, tenantID)
		}, &request, metadata)
		if err != nil {
			return err
		}

		setDataFunc := func(value interface{}, fieldMetadata *adapt.FieldMetadata) (interface{}, error) {
			if adapt.IsReference(fieldMetadata.Type) {
				return adapt.SetReferenceData(value, fieldMetadata, metadata)
			}
			return value, nil
		}

		searchFieldFunc := func(searchableValues []string) (string, interface{}) {
			return "", nil
		}

		err = adapt.ProcessInserts(
			&request,
			metadata,
			// Insert Func
			func(id interface{}, insert map[string]interface{}) error {
				dbID, ok := insert[idFieldDBName]
				if !ok {
					return errors.New("no key found for dynamodb insert")
				}

				insert[SystemID] = getSystemID(collectionName, dbID.(string))
				insert[SystemCollectionID] = collectionName

				itemDb, err := attributevalue.MarshalMap(insert)
				if err != nil {
					return err
				}

				ean := make(map[string]string)
				ean["#ID"] = idFieldDBName

				input := &dynamodb.PutItemInput{
					Item:                     itemDb,
					TableName:                aws.String(SystemTable),
					ConditionExpression:      aws.String("attribute_not_exists(#ID)"),
					ExpressionAttributeNames: ean,
				}
				_, err = client.PutItem(ctx, input)
				if err != nil {
					if strings.Contains(err.Error(), "ConditionalCheckFailedException") {
						return errors.New("item already exists")
					}
					return err
				}
				return nil
			},
			setDataFunc,
			getDBFieldName,
			searchFieldFunc,
			// DefaultID Func
			func() string {
				return uuid.New().String()
			},
		)
		if err != nil {
			return err
		}

		err = adapt.ProcessUpdates(
			&request,
			metadata,
			// Update Func
			func(id interface{}, update map[string]interface{}) error {

				dbID, ok := update[idFieldDBName]
				if !ok {
					return errors.New("no key found for dynamodb update")
				}
				delete(update, idFieldDBName)

				update[SystemCollectionID] = collectionName

				updates := expression.UpdateBuilder{}

				for name, value := range update {
					updates = updates.Set(expression.Name(name), expression.Value(value))
				}

				expr, err := expression.NewBuilder().WithUpdate(updates).Build()
				if err != nil {
					return err
				}

				input := &dynamodb.UpdateItemInput{
					Key: map[string]types.AttributeValue{
						SystemID: &types.AttributeValueMemberS{Value: getSystemID(collectionName, dbID.(string))},
					},
					TableName:                 aws.String(SystemTable),
					ExpressionAttributeNames:  expr.Names(),
					ExpressionAttributeValues: expr.Values(),
					ReturnValues:              "UPDATED_NEW",
					UpdateExpression:          expr.Update(),
				}

				_, err = client.UpdateItem(ctx, input)

				if err != nil {
					return errors.New("Update failed DynamoDB:" + err.Error())
				}

				return nil
			},
			setDataFunc,
			getDBFieldName,
			searchFieldFunc,
		)
		if err != nil {
			return err
		}

		err = adapt.ProcessDeletes(&request, metadata, func(dbID interface{}) error {

			_, err = client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
				Key: map[string]types.AttributeValue{
					SystemID: &types.AttributeValueMemberS{Value: getSystemID(collectionName, dbID.(string))},
				},
				TableName: aws.String(SystemTable),
			})
			if err != nil {
				return errors.New("Delete faild DynamoDB:" + err.Error())
			}
			return nil
		})
		if err != nil {
			return err
		}
	}
	return nil
}
