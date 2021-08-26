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
func (a *Adapter) Save(requests []adapt.SaveOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {

	ctx := context.Background()

	// Get a Firestore client.
	client, err := getClient(credentials)
	if err != nil {
		return errors.New("Failed to create or retrieve client:" + err.Error())
	}

	if len(requests) <= 0 {
		return nil
	}

	tenantID := credentials.GetTenantID()

	batch := client.Batch()

	for _, request := range requests {

		collectionMetadata, err := metadata.GetCollection(request.CollectionName)
		if err != nil {
			return err
		}

		collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
		if err != nil {
			return err
		}

		collection := client.Collection(collectionName)

		setDataFunc := func(value interface{}, fieldMetadata *adapt.FieldMetadata) (interface{}, error) {
			if adapt.IsReference(fieldMetadata.Type) {
				return adapt.SetReferenceData(value, fieldMetadata, metadata)
			}
			return value, nil
		}

		searchFieldFunc := func(searchableValues []string) (string, interface{}) {
			return searchIndexField, getSearchIndex(searchableValues)
		}

		err = adapt.ProcessInserts(
			&request,
			metadata,
			// Insert Func
			func(id interface{}, insert map[string]interface{}) error {
				batch.Create(collection.Doc(id.(string)), insert)
				return nil
			},
			setDataFunc,
			getDBFieldName,
			searchFieldFunc,
			// DefaultID Func
			func() string {
				return collection.NewDoc().ID
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
			setDataFunc,
			getDBFieldName,
			searchFieldFunc,
		)
		if err != nil {
			return err
		}

		err = adapt.ProcessDeletes(&request, metadata, func(dbID interface{}) error {
			batch = batch.Delete(collection.Doc(dbID.(string)))
			return nil
		})
		if err != nil {
			return err
		}

	}

	_, err = batch.Commit(ctx)
	if err != nil {
		return err
	}

	return nil
}
