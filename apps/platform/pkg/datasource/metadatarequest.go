package datasource

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// ParseSelectListKey function
func ParseSelectListKey(key string) (string, string, string) {
	keyParts := strings.Split(key, ":")
	return keyParts[0], keyParts[1], keyParts[2]
}

// FieldsMap type a recursive type to store an arbitrary list of nested fields
type FieldsMap map[string]FieldsMap

// MetadataRequestOptions struct
type MetadataRequestOptions struct {
	LoadAllFields bool
}

// MetadataRequest type
type MetadataRequest struct {
	Collections FieldsMap
	SelectLists map[string]bool
	Options     *MetadataRequestOptions
}

// HasRequests function
func (mr *MetadataRequest) HasRequests() bool {
	return len(mr.Collections) > 0 || len(mr.SelectLists) > 0
}

// AddCollection function
func (mr *MetadataRequest) AddCollection(collectionName string) error {
	if collectionName == "" {
		return fmt.Errorf("adding collection: %s", collectionName)
	}
	if mr.Collections == nil {
		mr.Collections = map[string]FieldsMap{}
	}
	_, ok := mr.Collections[collectionName]
	if !ok {
		mr.Collections[collectionName] = FieldsMap{}
	}
	return nil
}

// AddField function
func (mr *MetadataRequest) AddField(collectionName, fieldName string, subFields *FieldsMap) error {
	if collectionName == "" || fieldName == "" {
		return fmt.Errorf("adding field: %s, %s", collectionName, fieldName)
	}
	err := mr.AddCollection(collectionName)
	if err != nil {
		return err
	}
	if mr.Collections[collectionName] == nil {
		mr.Collections[collectionName] = FieldsMap{}
	}
	if subFields == nil {
		subFields = &FieldsMap{}
	}
	mr.Collections[collectionName][fieldName] = *subFields
	return nil
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
func (mr *MetadataRequest) Load(op *adapt.LoadOp, metadataResponse *adapt.MetadataCache, session *sess.Session) error {
	// Keep a list of additional metadata that we need to request in a subsequent call
	additionalRequests := MetadataRequest{}
	// Implement the old way to make sure it still works
	for collectionKey, collection := range mr.Collections {
		metadata, err := LoadCollectionMetadata(collectionKey, metadataResponse, session)
		if err != nil {
			return err
		}

		if mr.Options != nil && mr.Options.LoadAllFields {
			err = LoadAllFieldsMetadata(collectionKey, metadata, session)
			if err != nil {
				return err
			}
		} else {
			// Automagially add the id field and the name field whether they were requested or not.
			fieldsToLoad := []string{metadata.IDField, metadata.NameField}
			for fieldKey := range collection {
				fieldsToLoad = append(fieldsToLoad, fieldKey)
			}
			err = LoadFieldsMetadata(fieldsToLoad, collectionKey, metadata, session)
			if err != nil {
				return err
			}
		}

		for fieldKey, fieldMetadata := range metadata.Fields {

			if fieldMetadata.Type == "FILE" {
				userfilesCollection := "uesio.userfiles"
				fieldMetadata.ReferencedCollection = userfilesCollection
				// If the reference to a different data source, we'll
				// need to do a whole new approach to reference fields.
				if op != nil && metadata.DataSource != "uesio.platform" {
					err = additionalRequests.AddField(userfilesCollection, "uesio.mimetype", nil)
					if err != nil {
						return err
					}
					op.ReferencedCollections = adapt.ReferenceRegistry{}
					refCol := op.ReferencedCollections.Get(userfilesCollection)
					refCol.AddReference(fieldMetadata)
					refCol.AddFields([]adapt.LoadRequestField{
						{
							ID: "uesio.mimetype",
						},
					})
				}
			}

			if adapt.IsReference(fieldMetadata.Type) {
				err := additionalRequests.AddCollection(fieldMetadata.ReferencedCollection)
				if err != nil {
					return err
				}

				for fieldKey, subsubFields := range collection[fieldKey] {
					err := additionalRequests.AddField(fieldMetadata.ReferencedCollection, fieldKey, &subsubFields)
					if err != nil {
						return err
					}
				}
			}

			if fieldMetadata.Type == "SELECT" {
				additionalRequests.AddSelectList(collectionKey, fieldKey, fieldMetadata.SelectListName)
			}

		}
	}

	for selectListKey := range mr.SelectLists {
		err := LoadSelectListMetadata(selectListKey, metadataResponse, session)
		if err != nil {
			return err
		}
	}

	// Recursively load any additional requests from reference fields
	if additionalRequests.HasRequests() {
		return additionalRequests.Load(op, metadataResponse, session)
	}
	return nil
}
