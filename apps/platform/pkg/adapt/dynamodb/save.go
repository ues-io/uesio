package dynamodb

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	guuid "github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Save function
func (a *Adapter) Save(requests []adapt.SaveRequest, metadata *adapt.MetadataCache, credentials *adapt.Credentials) ([]adapt.SaveResponse, error) {

	ctx := context.Background()
	response := []adapt.SaveResponse{}
	client := getDynamoDB(credentials)

	if SystemSetUp != nil {
		return nil, SystemSetUp
	}

	for _, request := range requests {

		collectionMetadata, err := metadata.GetCollection(request.Collection)
		if err != nil {
			return nil, err
		}

		collectionName, err := getDBCollectionName(collectionMetadata)
		if err != nil {
			return nil, err
		}

		idFieldMetadata, err := collectionMetadata.GetIDField()
		if err != nil {
			return nil, err
		}

		idFieldDBName, err := getDBFieldName(idFieldMetadata)
		if err != nil {
			return nil, err
		}

		// Sometimes we only have the name of something instead of its real id
		// We can use this lookup functionality to get the real id before the save.
		err = adapt.HandleLookups(func(ops []adapt.LoadOp) error {
			return loadMany(ctx, client, ops, metadata)
		}, &request, metadata)
		if err != nil {
			return nil, err
		}

		changeResults, err := adapt.ProcessChanges(
			&request,
			metadata,
			// Update Func
			func(id interface{}, update map[string]interface{}) error {

				dbID, ok := update[idFieldDBName]
				if !ok {
					return errors.New("No key found for dynamoDb update")
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
					Key: map[string]*dynamodb.AttributeValue{
						idFieldDBName: {
							S: aws.String(getSystemID(collectionName, dbID.(string))),
						},
					},
					TableName:                 aws.String(SystemTable),
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
				dbID, ok := insert[idFieldDBName]
				if !ok {
					return errors.New("No key found for dynamoDb insert")
				}

				insert[SystemID] = getSystemID(collectionName, dbID.(string))
				insert[SystemCollectionID] = collectionName

				itemDb, err := dynamodbattribute.MarshalMap(insert)
				if err != nil {
					return err
				}
				input := &dynamodb.PutItemInput{
					Item:      itemDb,
					TableName: aws.String(SystemTable),
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
				return guuid.New().String()
			},
		)
		if err != nil {
			return nil, err
		}

		deleteResults, err := adapt.ProcessDeletes(&request, metadata, func(dbID string) error {
			_, err = client.DeleteItem(&dynamodb.DeleteItemInput{
				Key: map[string]*dynamodb.AttributeValue{
					idFieldDBName: {
						S: aws.String(dbID),
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
			return nil, err
		}

		response = append(response, adapt.SaveResponse{
			Wire:          request.Wire,
			ChangeResults: changeResults,
			DeleteResults: deleteResults,
		})
	}
	return response, nil
}
