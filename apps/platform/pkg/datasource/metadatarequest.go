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

func (fm *FieldsMap) merge(newFields *FieldsMap) {
	if newFields == nil {
		return
	}
	for field, subFields := range *newFields {
		existing := (*fm)[field]
		if existing == nil {
			(*fm)[field] = FieldsMap{}
		} else {
			existing.merge(&subFields)
		}
	}
}

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
	existingFields := mr.Collections[collectionName][fieldName]
	if existingFields == nil {
		existingFields = FieldsMap{}
	}
	existingFields.merge(subFields)
	mr.Collections[collectionName][fieldName] = existingFields
	return nil
}

// AddSelectList function
func (mr *MetadataRequest) AddSelectList(collectionName, fieldName, selectListName string) {
	if mr.SelectLists == nil {
		mr.SelectLists = map[string]bool{}
	}
	selectListKey := GetSelectListKey(collectionName, fieldName, selectListName)
	_, ok := mr.SelectLists[selectListKey]
	if !ok {
		mr.SelectLists[selectListKey] = true
	}
}

// GetSelectListKey function
func GetSelectListKey(collectionName, fieldName, selectListName string) string {
	return collectionName + ":" + fieldName + ":" + selectListName
}

// Load function
func (mr *MetadataRequest) Load(metadataResponse *adapt.MetadataCache, session *sess.Session) error {
	// Keep a list of additional metadata that we need to request in a subsequent call
	additionalRequests := MetadataRequest{
		Options: mr.Options,
	}
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

			specialRef, ok := specialRefs[fieldMetadata.Type]
			if ok {
				fieldMetadata.ReferenceMetadata = specialRef.ReferenceMetadata
				referenceMetadata := fieldMetadata.ReferenceMetadata

				// Only add to additional requests if we don't already have that metadata
				refCollection, _ := metadataResponse.GetCollection(referenceMetadata.Collection)
				for _, fieldID := range specialRef.Fields {
					if refCollection != nil {
						_, err := refCollection.GetField(fieldID)
						if err == nil {
							continue
						}
					}
					err = additionalRequests.AddField(referenceMetadata.Collection, fieldID, nil)
					if err != nil {
						return err
					}
				}
			}

			if adapt.IsReference(fieldMetadata.Type) {
				referenceMetadata := fieldMetadata.ReferenceMetadata
				// Only add to additional requests if we don't already have that metadata
				refCollection, err := metadataResponse.GetCollection(referenceMetadata.Collection)
				if err != nil {
					err := additionalRequests.AddCollection(referenceMetadata.Collection)
					if err != nil {
						return err
					}
				}

				for fieldKey, subsubFields := range collection[fieldKey] {
					if refCollection != nil {
						_, err := refCollection.GetField(fieldKey)
						if err == nil {
							continue
						}
					}
					err := additionalRequests.AddField(referenceMetadata.Collection, fieldKey, &subsubFields)
					if err != nil {
						return err
					}
				}
			}

			if fieldMetadata.Type == "SELECT" {
				selectListMetadata := fieldMetadata.SelectListMetadata
				if selectListMetadata.Options == nil {
					additionalRequests.AddSelectList(collectionKey, fieldKey, selectListMetadata.Name)
				}
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
		return additionalRequests.Load(metadataResponse, session)
	}
	return nil
}
