package datasource

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"

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
	Collections map[string]*adapt.MetadataCacheEntry[FieldsMap]
	SelectLists map[string]bool
	Options     *MetadataRequestOptions
}

func (mr *MetadataRequest) HasRequests() bool {
	return len(mr.Collections) > 0 || len(mr.SelectLists) > 0
}

func (mr *MetadataRequest) addCollectionDependency(collectionName string, isClientDependency bool) error {
	if collectionName == "" {
		return fmt.Errorf("tried to add blank collection")
	}
	if mr.Collections == nil {
		mr.Collections = map[string]*adapt.MetadataCacheEntry[FieldsMap]{}
	}
	currentEntry, ok := mr.Collections[collectionName]
	if !ok {
		mr.Collections[collectionName] = adapt.NewMetadataCacheEntry[FieldsMap](FieldsMap{}, isClientDependency)
	} else if isClientDependency && !currentEntry.IsClientDependency() {
		currentEntry.SetIsClientDependency(true)
	}
	return nil
}

// AddCollection requests that metadata be loaded for a Collection where the metadata is needed for the client
// (as opposed to just being needed server-side)
func (mr *MetadataRequest) AddCollection(collectionName string) error {
	return mr.addCollectionDependency(collectionName, true)
}

// AddTransientCollectionDependency requests that metadata be loaded for a Collection where the metadata
// is only needed for server-side processing, and does NOT need to be sent to the client
func (mr *MetadataRequest) AddTransientCollectionDependency(collectionName string) error {
	return mr.addCollectionDependency(collectionName, false)
}

func (mr *MetadataRequest) AddField(collectionName, fieldName string, subFields *FieldsMap) error {
	if fieldName == "" {
		return fmt.Errorf("cannot request metadata without a valid field name (collection = %s)", collectionName)
	}
	if collectionName == "" {
		return fmt.Errorf("cannot request metadata without a valid collection name (field = %s)", fieldName)
	}
	// Only add the collection if we already have it - otherwise use what we've got.
	// We don't want to inadvertently promote a transient dependency to a client-side dependency.
	collectionEntry, hasEntry := mr.Collections[collectionName]
	if !hasEntry {
		if err := mr.AddCollection(collectionName); err != nil {
			return err
		}
		collectionEntry = mr.Collections[collectionName]
	}
	var collectionFields FieldsMap
	if hasEntry {
		collectionFields = collectionEntry.GetValue()
	}
	if collectionFields == nil {
		collectionFields = FieldsMap{}
		mr.Collections[collectionName] = adapt.NewMetadataCacheEntry(collectionFields, true)
	}
	fieldMeta, hasField := collectionFields[fieldName]
	if !hasField {
		fieldMeta = FieldsMap{}
		collectionFields[fieldName] = fieldMeta
	}
	fieldMeta.merge(subFields)
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
			newKey = prefix + constant.RefSep + fieldKey
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
				err := additionalRequests.AddTransientCollectionDependency(referenceGroupMetadata.Collection)
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
	for collectionKey, cacheEntry := range mr.Collections {

		isClientDependency := cacheEntry.IsClientDependency()
		collectionMetadata := cacheEntry.GetValue()

		metadata, err := loadCollectionMetadata(collectionKey, isClientDependency, metadataResponse, session, connection)
		if err != nil {
			return err
		}

		if metadata.IsDynamic() || (mr.Options != nil && mr.Options.LoadAllFields) {
			if err = LoadAllFieldsMetadata(collectionKey, metadata, session, connection); err != nil {
				return err
			}
			metadata.HasAllFields = true
		} else {
			// Automagically add the id field and the name field whether they were requested or not.
			fieldsToLoad := []string{adapt.ID_FIELD, adapt.UNIQUE_KEY_FIELD, metadata.NameField}
			for fieldKey := range collectionMetadata {
				fieldsToLoad = append(fieldsToLoad, fieldKey)
			}
			if metadata.AccessField != "" {
				fieldsToLoad = append(fieldsToLoad, metadata.AccessField)
			}
			if err = LoadFieldsMetadata(fieldsToLoad, collectionKey, metadata, session, connection); err != nil {
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
			if err = additionalRequests.AddTransientCollectionDependency(accessFieldMetadata.ReferenceMetadata.Collection); err != nil {
				return err
			}
		}

		if err = ProcessFieldsMetadata(metadata.Fields, collectionKey, collectionMetadata, metadataResponse, &additionalRequests, ""); err != nil {
			return err
		}

	}

	for selectListKey := range mr.SelectLists {
		if err := LoadSelectListMetadata(selectListKey, metadataResponse, session, connection); err != nil {
			return err
		}
	}

	// Recursively load any additional requests from reference fields
	if additionalRequests.HasRequests() {
		return additionalRequests.Load(metadataResponse, session, connection)
	}
	return nil
}
