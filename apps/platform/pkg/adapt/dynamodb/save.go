package dynamodb

import (
	"errors"
	"fmt"
	"text/template"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	guuid "github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getDeletesForChange(delete adapt.DeleteRequest, collectionMetadata *adapt.CollectionMetadata, collectionName string) (map[string]interface{}, error) {
	dynamoDBDeleteKey := make(map[string]interface{})
	for fieldID, value := range delete {

		fieldMetadata, err := collectionMetadata.GetField(fieldID)
		if err != nil {
			return nil, err
		}

		fieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return nil, err
		}

		if fieldID == collectionMetadata.IDField {
			dynamoDBDeleteKey[fieldName] = getSystemID(collectionName, fmt.Sprintf("%v", value))
			dynamoDBDeleteKey[SystemCollectionID] = collectionName
		}

	}

	return dynamoDBDeleteKey, nil
}

func getUpdatesForChange(change adapt.ChangeRequest, collectionMetadata *adapt.CollectionMetadata, collectionName string) (map[string]interface{}, map[string]interface{}, error) {

	dynamoDBUpdate := make(map[string]interface{})
	dynamoDBUpdateKey := make(map[string]interface{})

	for fieldID, value := range change.FieldChanges {

		fieldMetadata, err := collectionMetadata.GetField(fieldID)
		if err != nil {
			return nil, nil, err
		}

		if fieldMetadata.Type == "REFERENCE" {
			// Don't update reference fields
			continue
		}

		fieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return nil, nil, err
		}

		if fieldID != collectionMetadata.IDField {
			dynamoDBUpdate[fieldName] = value
		} else {
			dynamoDBUpdate[SystemCollectionID] = collectionName
			dynamoDBUpdate[fieldName] = value
			dynamoDBUpdateKey[SystemID] = getSystemID(collectionName, fmt.Sprintf("%v", value))
		}

	}

	return dynamoDBUpdate, dynamoDBUpdateKey, nil
}

func getInsertsForChange(change adapt.ChangeRequest, collectionMetadata *adapt.CollectionMetadata, newID string) (map[string]interface{}, error) {
	inserts := map[string]interface{}{}

	for fieldID, value := range change.FieldChanges {
		fieldMetadata, err := collectionMetadata.GetField(fieldID)
		if err != nil {
			return nil, err
		}

		if fieldMetadata.Type == "REFERENCE" {
			// Don't update reference fields
			continue
		}

		fieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return nil, err
		}

		if fieldID == collectionMetadata.IDField && newID != "" {
			value = newID
		}

		inserts[fieldName] = value

	}

	return inserts, nil
}

func processOneDelete(delete adapt.DeleteRequest, collectionMetadata *adapt.CollectionMetadata, DynamoDBID string, collectionName string, client *dynamodb.DynamoDB) error {
	key, err := getDeletesForChange(delete, collectionMetadata, collectionName)
	if err != nil {
		return err
	}

	keyMarshal, err := dynamodbattribute.MarshalMap(key)
	if err != nil {
		return err
	}

	input := &dynamodb.DeleteItemInput{
		Key:       keyMarshal,
		TableName: aws.String(SystemTable),
	}

	_, err = client.DeleteItem(input)

	if err != nil {
		return errors.New("Delete faild DynamoDB:" + err.Error())
	}

	return nil
}

func processUpdate(change adapt.ChangeRequest, collectionMetadata *adapt.CollectionMetadata, collectionName string, client *dynamodb.DynamoDB) error {
	// it's an update!
	updates, key, err := getUpdatesForChange(change, collectionMetadata, collectionName)
	if err != nil {
		return err
	}

	updatesMarshal, err := dynamodbattribute.MarshalMap(updates)
	if err != nil {
		return err
	}
	keyMarshal, err := dynamodbattribute.MarshalMap(key)
	if err != nil {
		return err
	}

	expr, err := getExpressionUpdate(updatesMarshal)
	if err != nil {
		return errors.New("DynamoDB failed to generate expression:" + err.Error())
	}

	input := &dynamodb.UpdateItemInput{
		Key:                       keyMarshal,
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
}

func processInsert(change adapt.ChangeRequest, collectionMetadata *adapt.CollectionMetadata, collectionName string, client *dynamodb.DynamoDB, idTemplate *template.Template) (string, error) {
	// it's an insert!
	newID, err := templating.Execute(idTemplate, change.FieldChanges)
	if err != nil {
		return "", err
	}

	dynamoDBInsert, err := getInsertsForChange(change, collectionMetadata, newID)
	if err != nil {
		return "", err
	}

	idFieldMetadata, err := collectionMetadata.GetIDField()
	if err != nil {
		return "", err
	}
	idFieldName, err := getDBFieldName(idFieldMetadata)
	if err != nil {
		return "", err
	}

	if newID != "" {
		dynamoDBInsert[idFieldName] = newID
	} else {
		newID = guuid.New().String()
		dynamoDBInsert[idFieldName] = newID
	}

	dynamoDBInsert[SystemID] = getSystemID(collectionName, newID)
	dynamoDBInsert[SystemCollectionID] = collectionName

	itemDb, err := dynamodbattribute.MarshalMap(dynamoDBInsert)
	if err != nil {
		return "", err
	}

	input := &dynamodb.PutItemInput{
		Item:      itemDb,
		TableName: aws.String(SystemTable),
	}

	_, err = client.PutItem(input)
	if err != nil {
		return "", err
	}

	return newID, nil

}

func processChanges(changes map[string]adapt.ChangeRequest, collectionMetadata *adapt.CollectionMetadata, collectionName string, client *dynamodb.DynamoDB) (map[string]adapt.ChangeResult, error) {
	changeResults := map[string]adapt.ChangeResult{}

	idTemplate, err := templating.New(collectionMetadata.IDFormat)
	if err != nil {
		return nil, err
	}

	for changeID, change := range changes {
		changeResult := adapt.NewChangeResult(change)

		if !change.IsNew && change.IDValue != nil {
			err := processUpdate(change, collectionMetadata, collectionName, client)
			if err != nil {
				return nil, err
			}

		} else {
			newID, err := processInsert(change, collectionMetadata, collectionName, client, idTemplate)
			if err != nil {
				return nil, err
			}

			changeResult.Data[collectionMetadata.IDField] = newID
		}

		changeResults[changeID] = changeResult

	}
	return changeResults, nil
}

func processDeletes(deletes map[string]adapt.DeleteRequest, collectionMetadata *adapt.CollectionMetadata, collectionName string, client *dynamodb.DynamoDB) (map[string]adapt.ChangeResult, error) {
	deleteResults := map[string]adapt.ChangeResult{}
	for deleteID, delete := range deletes {
		deleteResult := adapt.ChangeResult{}
		deleteResult.Data = map[string]interface{}{}

		DynamoDBID, ok := delete[collectionMetadata.IDField].(string)
		if ok {
			err := processOneDelete(delete, collectionMetadata, DynamoDBID, collectionName, client)
			if err != nil {
				return nil, err
			}

		} else {
			return nil, errors.New("No id provided for delete")
		}

		deleteResults[deleteID] = deleteResult
	}
	return deleteResults, nil
}

func (a *Adapter) handleLookups(request adapt.SaveRequest, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {
	lookupOps, err := adapt.GetLookupOps(request, metadata)
	if err != nil {
		return err
	}

	if len(lookupOps) > 0 {
		err := a.Load(lookupOps, metadata, credentials)
		if err != nil {
			return err
		}

		err = adapt.MergeLookupResponses(request, lookupOps, metadata)
		if err != nil {
			return err
		}
	}

	return nil
}

// Save function
func (a *Adapter) Save(requests []adapt.SaveRequest, metadata *adapt.MetadataCache, credentials *adapt.Credentials) ([]adapt.SaveResponse, error) {

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

		err = a.handleLookups(request, metadata, credentials)
		if err != nil {
			return nil, err
		}

		changeResults, err := processChanges(request.Changes, collectionMetadata, collectionName, client)
		if err != nil {
			return nil, err
		}

		deleteResults, err := processDeletes(request.Deletes, collectionMetadata, collectionName, client)
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
