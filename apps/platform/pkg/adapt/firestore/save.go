package firestore

import (
	"context"
	"errors"
	"strings"

	"cloud.google.com/go/firestore"
	"github.com/thecloudmasters/uesio/pkg/adapt"
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

// Save function
func (a *Adapter) Save(requests []adapt.SaveRequest, metadata *adapt.MetadataCache, credentials *adapt.Credentials) ([]adapt.SaveResponse, error) {

	ctx := context.Background()
	response := []adapt.SaveResponse{}

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
				updates := []firestore.Update{}
				for fieldName, value := range update {
					updates = append(updates, firestore.Update{
						Path:  fieldName,
						Value: value,
					})
				}

				batch.Update(collection.Doc(id.(string)), updates)
				return nil
			},
			// Insert Func
			func(id interface{}, insert map[string]interface{}) error {
				batch.Create(collection.Doc(id.(string)), insert)
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
				return searchIndexField, getSearchIndex(searchableValues)
			},
			// DefaultID Func
			func() string {
				return collection.NewDoc().ID
			},
		)
		if err != nil {
			return nil, err
		}

		deleteResults, err := adapt.ProcessDeletes(&request, metadata, func(dbID string) error {
			batch = batch.Delete(collection.Doc(dbID))
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

		_, err = batch.Commit(ctx)
		if err != nil {
			return nil, err
		}
	}

	return response, nil
}
