package firestore

import (
	"context"
	"errors"
	"strings"
	"text/template"

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

func getUpdatesForChange(change adapters.ChangeRequest, collectionMetadata *adapters.CollectionMetadata) ([]firestore.Update, error) {
	updates := []firestore.Update{}
	searchableValues := []string{}
	for fieldID, value := range change.FieldChanges {
		if fieldID == collectionMetadata.IDField {
			// We don't need to add the id field to the update
			continue
		}

		if fieldID == collectionMetadata.NameField {
			searchableValues = append(searchableValues, value.(string))
		}
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

func getInsertsForChange(change adapters.ChangeRequest, collectionMetadata *adapters.CollectionMetadata) (map[string]interface{}, error) {
	inserts := map[string]interface{}{}
	searchableValues := []string{}
	for fieldID, value := range change.FieldChanges {
		fieldMetadata, err := collectionMetadata.GetField(fieldID)
		if err != nil {
			return nil, err
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

func processUpdate(change adapters.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, batch *firestore.WriteBatch, collection *firestore.CollectionRef) error {
	// it's an update!
	updates, err := getUpdatesForChange(change, collectionMetadata)
	if err != nil {
		return err
	}

	doc := collection.Doc(change.IDValue.(string))
	batch.Update(doc, updates)

	return nil
}

func processInsert(change adapters.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, batch *firestore.WriteBatch, collection *firestore.CollectionRef, idTemplate *template.Template) (string, error) {
	// it's an insert!
	newID, err := templating.Execute(idTemplate, change.FieldChanges)
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
	idFieldMetadata, err := collectionMetadata.GetIDField()
	if err != nil {
		return "", err
	}
	fieldName, err := getDBFieldName(idFieldMetadata)
	if err != nil {
		return "", err
	}

	inserts[fieldName] = doc.ID

	batch.Create(doc, inserts)

	return doc.ID, nil
}

func processChanges(changes map[string]adapters.ChangeRequest, collectionMetadata *adapters.CollectionMetadata, batch *firestore.WriteBatch, collection *firestore.CollectionRef) (map[string]adapters.ChangeResult, error) {
	changeResults := map[string]adapters.ChangeResult{}

	idTemplate, err := templating.New(collectionMetadata.IDFormat)
	if err != nil {
		return nil, err
	}

	for changeID, change := range changes {

		changeResult := adapters.NewChangeResult(change)

		if !change.IsNew && change.IDValue != nil {
			err := processUpdate(change, collectionMetadata, batch, collection)
			if err != nil {
				return nil, err
			}

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

func processDeletes(deletes map[string]adapters.DeleteRequest, collectionMetadata *adapters.CollectionMetadata, batch *firestore.WriteBatch, collection *firestore.CollectionRef) (map[string]adapters.ChangeResult, error) {
	deleteResults := map[string]adapters.ChangeResult{}
	for deleteID, delete := range deletes {
		deleteResult := adapters.ChangeResult{}
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

func (a *Adapter) handleLookups(request adapters.SaveRequest, metadata *adapters.MetadataCache, credentials *adapters.Credentials) error {

	lookupOps, err := adapters.GetLookupOps(request, metadata)
	if err != nil {
		return err
	}

	if len(lookupOps) > 0 {
		err := a.Load(lookupOps, metadata, credentials)
		if err != nil {
			return err
		}

		err = adapters.MergeLookupResponses(request, lookupOps, metadata)
		if err != nil {
			return err
		}
	}

	return nil
}

// Save function
func (a *Adapter) Save(requests []adapters.SaveRequest, metadata *adapters.MetadataCache, credentials *adapters.Credentials) ([]adapters.SaveResponse, error) {

	ctx := context.Background()
	response := []adapters.SaveResponse{}

	// Get a Firestore client.
	client, err := getClient(credentials)
	if err != nil {
		return nil, errors.New("Failed to create or retrieve client:" + err.Error())
	}

	if len(requests) <= 0 {
		return response, nil
	}

	for _, request := range requests {

		batch := client.Batch()

		collectionMetadata, err := metadata.GetCollection(request.Collection)
		if err != nil {
			return nil, err
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

		response = append(response, adapters.SaveResponse{
			Wire:          request.Wire,
			ChangeResults: changeResults,
			DeleteResults: deleteResults,
		})

		_, err = batch.Commit(ctx)
		if err != nil {
			return nil, err
		}
	}

	return response, nil
}
