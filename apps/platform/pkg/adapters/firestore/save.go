package firestore

import (
	"context"
	"errors"
	"strings"
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/reqs"

	"cloud.google.com/go/firestore"
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getSearchIndex(values []string) map[string]bool {
	index := map[string]bool{}

	for _, value := range values {
		// split the value on spaces
		tokens := strings.Fields(value)
		for _, token := range tokens {
			searchtoken := ""
			lowerToken := strings.ToLower(token)
			for _, char := range lowerToken {
				searchtoken = searchtoken + string(char)
				index[searchtoken] = true
			}
		}
	}
	return index
}

func getUpdatesForChange(change reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata) ([]firestore.Update, error) {
	updates := []firestore.Update{}
	searchableValues := []string{}
	for fieldID, value := range change {
		if fieldID == collectionMetadata.IDField {
			// We don't need to add the id field to the update
			continue
		}

		if fieldID == collectionMetadata.NameField {
			searchableValues = append(searchableValues, value.(string))
		}
		fieldMetadata, ok := collectionMetadata.Fields[fieldID]
		if !ok {
			return nil, errors.New("No metadata provided for field: " + fieldID)
		}

		if fieldMetadata.Type == "REFERENCE" {
			// Don't update reference fields
			continue
		}

		fieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return nil, err
		}

		updates = append(updates, firestore.Update{
			Path:  fieldName,
			Value: value,
		})

	}

	// Add the search helper field
	if len(searchableValues) > 0 {
		updates = append(updates, firestore.Update{
			Path:  searchIndexField,
			Value: getSearchIndex(searchableValues),
		})
	}

	return updates, nil
}

func getInsertsForChange(change reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata) (map[string]interface{}, error) {
	inserts := map[string]interface{}{}
	searchableValues := []string{}
	for fieldID, value := range change {
		fieldMetadata, ok := collectionMetadata.Fields[fieldID]
		if !ok {
			return nil, errors.New("No metadata provided for field: " + fieldID)
		}

		if fieldID == collectionMetadata.NameField {
			searchableValues = append(searchableValues, value.(string))
		}

		if fieldMetadata.Type == "REFERENCE" {
			// Don't update reference fields
			continue
		}

		fieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return nil, err
		}

		inserts[fieldName] = value

	}

	// Add the search helper field
	if len(searchableValues) > 0 {
		inserts[searchIndexField] = getSearchIndex(searchableValues)
	}

	return inserts, nil
}

func processUpdate(change reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, batch *firestore.WriteBatch, collection *firestore.CollectionRef, firestoreID string) error {
	// it's an update!
	updates, err := getUpdatesForChange(change, collectionMetadata)
	if err != nil {
		return err
	}

	doc := collection.Doc(firestoreID)
	batch = batch.Update(doc, updates)

	return nil
}

func processInsert(change reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, batch *firestore.WriteBatch, collection *firestore.CollectionRef, idTemplate *template.Template) (string, error) {
	// it's an insert!
	newID, err := templating.Execute(idTemplate, change)
	if err != nil {
		return "", err
	}

	inserts, err := getInsertsForChange(change, collectionMetadata)
	if err != nil {
		return "", err
	}

	var doc *firestore.DocumentRef

	if newID != "" {
		doc = collection.Doc(newID)
	} else {
		doc = collection.NewDoc()
	}

	// Add in the new id field as the id field
	idFieldMetadata, ok := collectionMetadata.Fields[collectionMetadata.IDField]
	if !ok {
		return "", errors.New("No metadata provided for field: " + collectionMetadata.IDField)
	}
	fieldName, err := getDBFieldName(idFieldMetadata)
	if err != nil {
		return "", err
	}

	inserts[fieldName] = doc.ID

	batch = batch.Create(doc, inserts)

	return doc.ID, nil
}

func processChanges(changes map[string]reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, batch *firestore.WriteBatch, collection *firestore.CollectionRef) (map[string]reqs.ChangeResult, error) {
	changeResults := map[string]reqs.ChangeResult{}

	idTemplate, err := templating.New(collectionMetadata.IDFormat)
	if err != nil {
		return nil, err
	}

	for changeID, change := range changes {
		changeResult := reqs.ChangeResult{}
		changeResult.Data = change

		firestoreID, ok := change[collectionMetadata.IDField].(string)
		if ok && firestoreID != "" {
			err := processUpdate(change, collectionMetadata, batch, collection, firestoreID)
			if err != nil {
				return nil, err
			}
			changeResult.Data[collectionMetadata.IDField] = firestoreID

		} else {
			newID, err := processInsert(change, collectionMetadata, batch, collection, idTemplate)
			if err != nil {
				return nil, err
			}

			changeResult.Data[collectionMetadata.IDField] = newID
		}

		changeResults[changeID] = changeResult

	}
	return changeResults, nil
}

func processDeletes(deletes map[string]reqs.DeleteRequest, collectionMetadata *adapters.CollectionMetadata, batch *firestore.WriteBatch, collection *firestore.CollectionRef) (map[string]reqs.ChangeResult, error) {
	deleteResults := map[string]reqs.ChangeResult{}
	for deleteID, delete := range deletes {
		deleteResult := reqs.ChangeResult{}
		deleteResult.Data = map[string]interface{}{}

		firestoreID, ok := delete[collectionMetadata.IDField].(string)
		if ok {
			doc := collection.Doc(firestoreID)
			batch = batch.Delete(doc)
			deleteResult.Data[collectionMetadata.IDField] = doc.ID
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

	ctx := context.Background()
	response := []reqs.SaveResponse{}

	// Get a Firestore client.
	client, err := getClient(credentials)
	if err != nil {
		return nil, errors.New("Failed to create or retrieve client:" + err.Error())
	}

	if len(requests) <= 0 {
		return response, nil
	}

	batch := client.Batch()

	for _, request := range requests {

		collectionMetadata, ok := metadata.Collections[request.Collection]
		if !ok {
			return nil, errors.New("No metadata provided for collection: " + request.Collection)
		}

		collectionName, err := getDBCollectionName(collectionMetadata)
		if err != nil {
			return nil, err
		}

		collection := client.Collection(collectionName)

		// Sometimes we only have the name of something instead of its real id
		// We can use this lookup functionality to get the real id before the save.
		err = a.handleLookups(request, metadata, credentials)
		if err != nil {
			return nil, err
		}

		changeResults, err := processChanges(request.Changes, collectionMetadata, batch, collection)
		if err != nil {
			return nil, err
		}

		deleteResults, err := processDeletes(request.Deletes, collectionMetadata, batch, collection)
		if err != nil {
			return nil, err
		}

		response = append(response, reqs.SaveResponse{
			Wire:          request.Wire,
			ChangeResults: changeResults,
			DeleteResults: deleteResults,
		})
	}

	_, err = batch.Commit(ctx)
	if err != nil {
		return nil, err
	}

	return response, nil
}
