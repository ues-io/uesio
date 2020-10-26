package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// ParseSelectListKey function
func ParseSelectListKey(key string) (string, string, string) {
	keyParts := strings.Split(key, ":")
	return keyParts[0], keyParts[1], keyParts[2]
}

// FieldsMap type a recursive type to store an arbitrary list of nested fields
type FieldsMap map[string]FieldsMap

// MetadataRequest type
type MetadataRequest struct {
	Collections FieldsMap
	SelectLists map[string]bool
}

// HasRequests function
func (mr *MetadataRequest) HasRequests() bool {
	return len(mr.Collections) > 0 || len(mr.SelectLists) > 0
}

// AddCollection function
func (mr *MetadataRequest) AddCollection(collectionName string) {
	if mr.Collections == nil {
		mr.Collections = map[string]FieldsMap{}
	}
	_, ok := mr.Collections[collectionName]
	if !ok {
		mr.Collections[collectionName] = FieldsMap{}
	}
}

// AddField function
func (mr *MetadataRequest) AddField(collectionName, fieldName string, subFields *FieldsMap) {
	mr.AddCollection(collectionName)
	if mr.Collections[collectionName] == nil {
		mr.Collections[collectionName] = FieldsMap{}
	}
	if subFields == nil {
		subFields = &FieldsMap{}
	}
	mr.Collections[collectionName][fieldName] = *subFields
}

// AddSelectList function
func (mr *MetadataRequest) AddSelectList(collectionName, fieldName, selectListName string) {
	if mr.SelectLists == nil {
		mr.SelectLists = map[string]bool{}
	}
	selectListKey := mr.GetSelectListKey(collectionName, fieldName, selectListName)
	_, ok := mr.SelectLists[selectListKey]
	if !ok {
		mr.SelectLists[selectListKey] = true
	}
}

// GetSelectListKey function
func (mr *MetadataRequest) GetSelectListKey(collectionName, fieldName, selectListName string) string {
	return collectionName + ":" + fieldName + ":" + selectListName
}

// Load function
func (mr *MetadataRequest) Load(metadataResponse *adapters.MetadataCache, collatedMetadata map[string]*adapters.MetadataCache, session *sess.Session) error {
	// Keep a list of additional metadata that we need to request in a subsequent call
	additionalRequests := MetadataRequest{}
	// Implement the old way to make sure it still works
	for collectionKey, collection := range mr.Collections {
		metadata, err := LoadCollectionMetadata(collectionKey, metadataResponse, session)
		if err != nil {
			return err
		}

		// Automagially add the id field and the name field whether they were requested or not.
		_, err = LoadFieldMetadata(metadata.IDField, collectionKey, metadata, session)
		if err != nil {
			return err
		}

		_, err = LoadFieldMetadata(metadata.NameField, collectionKey, metadata, session)
		if err != nil {
			return err
		}

		for fieldKey, subFields := range collection {
			// TODO: Bulkify this request so we don't do a network call per field
			fieldMetadata, err := LoadFieldMetadata(fieldKey, collectionKey, metadata, session)
			if err != nil {
				return err
			}

			if fieldMetadata.Type == "REFERENCE" {
				additionalRequests.AddCollection(fieldMetadata.ReferencedCollection)

				for fieldKey, subsubFields := range subFields {
					additionalRequests.AddField(fieldMetadata.ReferencedCollection, fieldKey, &subsubFields)
				}

				_, err = LoadFieldMetadata(fieldMetadata.ForeignKeyField, collectionKey, metadata, session)
				if err != nil {
					return err
				}
			}

			if fieldMetadata.Type == "SELECT" {
				additionalRequests.AddSelectList(collectionKey, fieldKey, fieldMetadata.SelectListName)
			}

		}
		// Collate the metadata so we have a dictonary of it based on data source
		CollateMetadata(collectionKey, metadata, collatedMetadata)
	}

	for selectListKey := range mr.SelectLists {
		err := LoadSelectListMetadata(selectListKey, metadataResponse, session)
		if err != nil {
			return err
		}
	}

	// Recursively load any additional requests from reference fields
	if additionalRequests.HasRequests() {
		return additionalRequests.Load(metadataResponse, collatedMetadata, session)
	}
	return nil
}
