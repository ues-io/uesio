package datasource

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func ParseSelectListKey(key string) (string, string, string) {
	keyParts := strings.Split(key, ":")
	return keyParts[0], keyParts[1], keyParts[2]
}

func GetFullMetadataForCollection(metadataResponse *adapt.MetadataCache, collectionID string, session *sess.Session) error {
	collections := MetadataRequest{
		Options: &MetadataRequestOptions{
			LoadAllFields: true,
		},
	}
	err := collections.AddCollection(collectionID)
	if err != nil {
		return err
	}

	return collections.Load(metadataResponse, session, nil)
}

func GetMetadataResponse(metadataResponse *adapt.MetadataCache, collectionID, fieldID string, session *sess.Session) error {
	collections := MetadataRequest{}

	if fieldID != "" {
		err := collections.AddField(collectionID, fieldID, nil)
		if err != nil {
			return err
		}
	} else {
		err := collections.AddCollection(collectionID)
		if err != nil {
			return err
		}
	}

	return collections.Load(metadataResponse, session, nil)

}

// FieldsMap type a recursive type to store an arbitrary list of nested fields
type FieldsMap map[string]FieldsMap

func (fm *FieldsMap) getRequestFields() []adapt.LoadRequestField {
	fields := []adapt.LoadRequestField{
		{
			ID: adapt.ID_FIELD,
		},
	}
	if fm == nil {
		return fields
	}
	for fieldKey, subFields := range *fm {
		fields = append(fields, adapt.LoadRequestField{
			ID:     fieldKey,
			Fields: subFields.getRequestFields(),
		})
	}
	return fields
}

func (fm *FieldsMap) merge(newFields *FieldsMap) {
	if newFields == nil {
		return
	}
	for field, subFields := range *newFields {
		existing := (*fm)[field]
		if existing == nil {
			(*fm)[field] = subFields
		} else {
			existing.merge(&subFields)
		}
	}
}

type MetadataRequestOptions struct {
	LoadAllFields bool
}

type MetadataRequest struct {
	Collections FieldsMap
	SelectLists map[string]bool
	Options     *MetadataRequestOptions
}

func (mr *MetadataRequest) HasRequests() bool {
	return len(mr.Collections) > 0 || len(mr.SelectLists) > 0
}

func (mr *MetadataRequest) AddCollection(collectionName string) error {
	if collectionName == "" {
		return fmt.Errorf("tried to add blank collection")
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

func GetSelectListKey(collectionName, fieldName, selectListName string) string {
	return collectionName + ":" + fieldName + ":" + selectListName
}

func ProcessFieldsMetadata(fields map[string]*adapt.FieldMetadata, collectionKey string, collection FieldsMap, metadataResponse *adapt.MetadataCache, additionalRequests *MetadataRequest, prefix string) error {

	collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
	if err != nil {
		return err
	}

	for fieldKey, fieldMetadata := range fields {

		newKey := fieldKey
		if prefix != "" {
			newKey = prefix + "->" + fieldKey
		}

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
				err := additionalRequests.AddField(referenceMetadata.Collection, fieldID, nil)
				if err != nil {
					return err
				}
			}
		}

		if adapt.IsReference(fieldMetadata.Type) {

			// If we only have one field, and it's the id field, skip getting metadata
			if len(collection[fieldKey]) == 1 {
				_, ok := collection[fieldKey][adapt.ID_FIELD]
				if ok {
					continue
				}
			}

			referenceMetadata := fieldMetadata.ReferenceMetadata
			// Only add to additional requests if we don't already have that metadata
			refCollection, err := metadataResponse.GetCollection(referenceMetadata.Collection)
			if err != nil {
				err := additionalRequests.AddCollection(referenceMetadata.Collection)
				if err != nil {
					return err
				}
			}

			for fieldKey, nestedSubFields := range collection[fieldKey] {
				// Optimization for if we already have the field metadata
				// NOTE: We can't do this optimization if we have nestedSubFields
				// There could be nestedSubFields that we haven't loaded yet.
				if refCollection != nil {
					_, err := refCollection.GetField(fieldKey)
					hasEmptySubSubFields := nestedSubFields == nil || len(nestedSubFields) == 0
					if err == nil && hasEmptySubSubFields {
						continue
					}
				}
				err := additionalRequests.AddField(referenceMetadata.Collection, fieldKey, &nestedSubFields)
				if err != nil {
					return err
				}
			}
		}

		if fieldMetadata.Type == "REFERENCEGROUP" {

			referenceGroupMetadata := fieldMetadata.ReferenceGroupMetadata
			// Only add to additional requests if we don't already have that metadata
			refCollection, err := metadataResponse.GetCollection(referenceGroupMetadata.Collection)
			if err != nil {
				err := additionalRequests.AddCollection(referenceGroupMetadata.Collection)
				if err != nil {
					return err
				}
			}

			if refCollection != nil {
				_, err := refCollection.GetField(referenceGroupMetadata.Field)
				if err == nil {
					continue
				}
			}
			//Foreign key field
			err = additionalRequests.AddField(referenceGroupMetadata.Collection, referenceGroupMetadata.Field, nil)
			if err != nil {
				return err
			}

			for fieldKey, nestedSubFields := range collection[fieldKey] {
				if refCollection != nil {
					_, err := refCollection.GetField(fieldKey)
					if err == nil {
						continue
					}
				}
				err := additionalRequests.AddField(referenceGroupMetadata.Collection, fieldKey, &nestedSubFields)
				if err != nil {
					return err
				}
			}
		}

		if fieldMetadata.Type == "SELECT" || fieldMetadata.Type == "MULTISELECT" {
			selectListMetadata := fieldMetadata.SelectListMetadata
			if selectListMetadata.Options == nil {
				additionalRequests.AddSelectList(collectionKey, newKey, selectListMetadata.Name)
			}
		}

		if fieldMetadata.Type == "MAP" || fieldMetadata.Type == "STRUCT" || fieldMetadata.Type == "LIST" {
			err := ProcessFieldsMetadata(fieldMetadata.SubFields, collectionKey, collection, metadataResponse, additionalRequests, newKey)
			if err != nil {
				return err
			}
		}

		if fieldMetadata.IsFormula && fieldMetadata.FormulaMetadata != nil {
			fieldDeps, err := adapt.GetFormulaFields(fieldMetadata.FormulaMetadata.Expression)
			if err != nil {
				return err
			}

			for fieldKey := range fieldDeps {
				// Optimization for if we already have the field metadata
				_, err := collectionMetadata.GetField(fieldKey)
				if err == nil {
					continue
				}

				err = additionalRequests.AddField(collectionKey, fieldKey, nil)
				if err != nil {
					return err
				}
			}
		}

	}

	return nil

}

func (mr *MetadataRequest) Load(metadataResponse *adapt.MetadataCache, session *sess.Session, connection adapt.Connection) error {
	// Keep a list of additional metadata that we need to request in a subsequent call
	additionalRequests := MetadataRequest{
		Options: &MetadataRequestOptions{
			LoadAllFields: false,
		},
	}
	// Implement the old way to make sure it still works
	for collectionKey, collection := range mr.Collections {
		metadata, err := LoadCollectionMetadata(collectionKey, metadataResponse, session, connection)
		if err != nil {
			return err
		}

		if metadata.IsDynamic() || (mr.Options != nil && mr.Options.LoadAllFields) {
			addAllBuiltinFields(metadata)
			err = LoadAllFieldsMetadata(collectionKey, metadata, session, connection)
			if err != nil {
				return err
			}
			metadata.HasAllFields = true
		} else {
			addBuiltinFields(metadata, collection)
			// Automagically add the id field and the name field whether they were requested or not.
			fieldsToLoad := []string{adapt.ID_FIELD, metadata.NameField}
			for fieldKey := range collection {
				fieldsToLoad = append(fieldsToLoad, fieldKey)
			}
			if metadata.AccessField != "" {
				fieldsToLoad = append(fieldsToLoad, metadata.AccessField)
			}
			err = LoadFieldsMetadata(fieldsToLoad, collectionKey, metadata, session, connection)
			if err != nil {
				return err
			}
		}

		if metadata.AccessField != "" {
			accessFieldMetadata, err := metadata.GetField(metadata.AccessField)
			if err != nil {
				return err
			}
			// Get all Fields from the AccessFields collection
			additionalRequests.Options.LoadAllFields = true
			err = additionalRequests.AddCollection(accessFieldMetadata.ReferenceMetadata.Collection)
			if err != nil {
				return err
			}
		}

		err = ProcessFieldsMetadata(metadata.Fields, collectionKey, collection, metadataResponse, &additionalRequests, "")
		if err != nil {
			return err
		}

	}

	for selectListKey := range mr.SelectLists {
		err := LoadSelectListMetadata(selectListKey, metadataResponse, session, connection)
		if err != nil {
			return err
		}
	}

	// Recursively load any additional requests from reference fields
	if additionalRequests.HasRequests() {
		return additionalRequests.Load(metadataResponse, session, connection)
	}
	return nil
}
