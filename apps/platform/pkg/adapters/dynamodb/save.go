package dynamodb

import (
	"errors"
	"fmt"
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	guuid "github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getDeletesForChange(delete reqs.DeleteRequest, collectionMetadata *adapters.CollectionMetadata, collectionName string) (map[string]interface{}, error) {
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

func getUpdatesForChange(change reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, collectionName string) (map[string]interface{}, map[string]interface{}, error) {

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

func getInsertsForChange(change reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, newID string) (map[string]interface{}, error) {
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

func processOneDelete(delete reqs.DeleteRequest, collectionMetadata *adapters.CollectionMetadata, DynamoDBID string, collectionName string, client *dynamodb.DynamoDB) error {
	key, err := getDeletesForChange(delete, collectionMetadata, collectionName)
	if err != nil {
		return err
	}

	keyMarshal, err := dynamodbattribute.MarshalMap(key)

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

func processUpdate(change reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, collectionName string, client *dynamodb.DynamoDB) error {
	// it's an update!
	updates, key, err := getUpdatesForChange(change, collectionMetadata, collectionName)
	if err != nil {
		return err
	}

	updatesMarshal, err := dynamodbattribute.MarshalMap(updates)
	keyMarshal, err := dynamodbattribute.MarshalMap(key)

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

func processInsert(change reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, collectionName string, client *dynamodb.DynamoDB, idTemplate *template.Template) (string, error) {
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

func processChanges(changes map[string]reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, collectionName string, client *dynamodb.DynamoDB) (map[string]reqs.ChangeResult, error) {
	changeResults := map[string]reqs.ChangeResult{}

	idTemplate, err := templating.New(collectionMetadata.IDFormat)
	if err != nil {
		return nil, err
	}

	for changeID, change := range changes {
		changeResult := reqs.NewChangeResult(change)

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

func processDeletes(deletes map[string]reqs.DeleteRequest, collectionMetadata *adapters.CollectionMetadata, collectionName string, client *dynamodb.DynamoDB) (map[string]reqs.ChangeResult, error) {
	deleteResults := map[string]reqs.ChangeResult{}
	for deleteID, delete := range deletes {
		deleteResult := reqs.ChangeResult{}
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

func (a *Adapter) handleLookups(request reqs.SaveRequest, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) error {
	lookupRequests, err := adapters.GetLookupRequests(request, metadata)
	if err != nil {
		return err
	}

	if lookupRequests != nil && len(lookupRequests) > 0 {
		lookupResponses, err := a.Load(lookupRequests, metadata, credentials)
		if err != nil {
			return err
		}

		err = adapters.MergeLookupResponses(request, lookupResponses, metadata)
		if err != nil {
			return err
		}
	}

	return nil
}

// Save function
func (a *Adapter) Save(requests []reqs.SaveRequest, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) ([]reqs.SaveResponse, error) {

	response := []reqs.SaveResponse{}
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

		response = append(response, reqs.SaveResponse{
			Wire:          request.Wire,
			ChangeResults: changeResults,
			DeleteResults: deleteResults,
		})
	}
	return response, nil
}
