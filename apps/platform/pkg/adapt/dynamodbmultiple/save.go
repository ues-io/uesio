package dynamodbmultiple

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Save function
func (a *Adapter) Save(requests []adapt.SaveOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {

	ctx := context.Background()
	client := getDynamoDB(credentials)

	for _, request := range requests {

		collectionMetadata, err := metadata.GetCollection(request.CollectionName)
		if err != nil {
			return err
		}

		collectionName, err := getDBCollectionName(collectionMetadata)
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
			return loadMany(ctx, client, ops, metadata)
		}, &request, metadata)
		if err != nil {
			return err
		}

		err = adapt.ProcessChanges(
			&request,
			metadata,
			// Update Func
			func(id interface{}, update map[string]interface{}) error {

				dbID, ok := update[idFieldDBName]
				if !ok {
					return errors.New("No key found for dynamoDb update")
				}
				delete(update, idFieldDBName)

				updates := expression.UpdateBuilder{}

				for name, value := range update {
					updates = updates.Set(expression.Name(name), expression.Value(value))
				}

				expr, err := expression.NewBuilder().WithUpdate(updates).Build()
				if err != nil {
					return err
				}

				input := &dynamodb.UpdateItemInput{
					Key: map[string]*dynamodb.AttributeValue{
						idFieldDBName: {
							S: aws.String(dbID.(string)),
						},
					},
					TableName:                 aws.String(collectionName),
					ExpressionAttributeNames:  expr.Names(),
					ExpressionAttributeValues: expr.Values(),
					ReturnValues:              aws.String("UPDATED_NEW"),
					UpdateExpression:          expr.Update(),
				}

				_, err = client.UpdateItem(input)

				if err != nil {
					return errors.New("Update failed DynamoDB:" + err.Error())
				}

				return nil
			},
			// Insert Func
			func(id interface{}, insert map[string]interface{}) error {
				itemDb, err := dynamodbattribute.MarshalMap(insert)
				if err != nil {
					return err
				}
				input := &dynamodb.PutItemInput{
					Item:      itemDb,
					TableName: aws.String(collectionName),
				}
				_, err = client.PutItem(input)
				if err != nil {
					return err
				}
				return nil
			},
			// SetData Func
			func(value interface{}, fieldMetadata *adapt.FieldMetadata) (interface{}, error) {
				if adapt.IsReference(fieldMetadata.Type) {
					return adapt.SetReferenceData(value, fieldMetadata, metadata)
				}
				return value, nil
			},
			// FieldName Func
			getDBFieldName,
			// SearchField Func
			func(searchableValues []string) (string, interface{}) {
				return "", nil
			},
			// DefaultID Func
			func() string {
				return uuid.New().String()
			},
		)
		if err != nil {
			return err
		}

		err = adapt.ProcessDeletes(&request, metadata, func(dbID interface{}) error {
			_, err = client.DeleteItem(&dynamodb.DeleteItemInput{
				Key: map[string]*dynamodb.AttributeValue{
					idFieldDBName: {
						S: aws.String(dbID.(string)),
					},
				},
				TableName: aws.String(collectionName),
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
