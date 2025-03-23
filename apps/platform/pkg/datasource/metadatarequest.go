package datasource

import (
	"context"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/formula"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetFullMetadataForCollection(metadataResponse *wire.MetadataCache, collectionID string, session *sess.Session, connection wire.Connection) error {
	collections := MetadataRequest{
		Options: &MetadataRequestOptions{
			LoadAllFields:    true,
			LoadAccessFields: true,
		},
	}
	err := collections.AddCollection(collectionID)
	if err != nil {
		return err
	}

	return collections.Load(metadataResponse, session, connection)
}

func GetMetadataResponse(metadataResponse *wire.MetadataCache, collectionID, fieldID string, session *sess.Session) error {
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

func (fm *FieldsMap) getRequestFields() []wire.LoadRequestField {
	if fm == nil {
		return nil
	}
	fields := []wire.LoadRequestField{
		{
			ID: commonfields.Id,
		},
	}

	for fieldKey, subFields := range *fm {
		if fieldKey == commonfields.Id {
			continue
		}
		fields = append(fields, wire.LoadRequestField{
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

func (fm *FieldsMap) add(fieldKey string) {
	fm.merge(getFieldsMap([]string{fieldKey}))
}

func (fm *FieldsMap) addMany(fieldKeys []string) {
	fm.merge(getFieldsMap(fieldKeys))
}

func getFieldsMap(fieldKeys []string) *FieldsMap {
	fieldsMap := FieldsMap{}
	for _, fieldKey := range fieldKeys {
		fieldParts := strings.Split(fieldKey, constant.RefSep)
		if len(fieldParts) == 1 {
			// This is somewhat wierd, but it prevents reference
			// fields in the token from being fully loaded.
			// It shouldn't affect other fields
			fieldsMap[fieldKey] = FieldsMap{
				commonfields.Id: nil,
			}
		} else {
			fieldsMap[fieldParts[0]] = *getFieldsMap([]string{strings.Join(fieldParts[1:], constant.RefSep)})
		}
	}
	return &fieldsMap
}

type MetadataRequestOptions struct {
	LoadAllFields    bool
	LoadAccessFields bool
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
		return exceptions.NewBadRequestException("tried to add blank collection")
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
	if collectionName == "" {
		return fmt.Errorf("cannot request metadata without a valid collection name (field = %s)", fieldName)
	}
	if fieldName == "" {
		return fmt.Errorf("cannot request metadata without a valid field name (collection = %s)", collectionName)
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

func (mr *MetadataRequest) AddSelectList(selectListName string) {
	if mr.SelectLists == nil {
		mr.SelectLists = map[string]bool{}
	}
	_, ok := mr.SelectLists[selectListName]
	if !ok {
		mr.SelectLists[selectListName] = true
	}
}

func GetMetadataRequestForLoad(op *wire.LoadOp, ops []*wire.LoadOp, session *sess.Session) (*MetadataRequest, error) {

	collectionKey := op.CollectionName

	// Keep a running tally of all requested collections
	metadataRequest := &MetadataRequest{}
	if err := metadataRequest.AddCollection(collectionKey); err != nil {
		return nil, err
	}

	for _, requestField := range op.Fields {

		if requestField.ViewOnlyMetadata != nil {
			getMetadataForViewOnlyField(requestField, metadataRequest)
			continue
		}

		if !session.GetContextPermissions().HasFieldReadPermission(collectionKey, requestField.ID) {
			return nil, exceptions.NewForbiddenException(fmt.Sprintf("Profile %s does not have read access to the %s field.", session.GetContextProfile(), requestField.ID))
		}

		subFields := getSubFields(requestField.Fields)
		err := metadataRequest.AddField(collectionKey, requestField.ID, subFields)
		if err != nil {
			return nil, err
		}
	}

	if op.Aggregate {
		for _, requestField := range op.GroupBy {
			err := metadataRequest.AddField(collectionKey, requestField.ID, nil)
			if err != nil {
				return nil, err
			}
		}
	}

	for _, condition := range op.Conditions {
		innerErr := getMetadataForConditionLoad(&condition, collectionKey, metadataRequest, op, ops)
		if innerErr != nil {
			return nil, innerErr
		}
	}

	if len(op.Order) > 0 {
		for _, orderField := range op.Order {
			if err := getMetadataForOrderField(collectionKey, orderField.Field, metadataRequest, session); err != nil {
				return nil, err
			}
		}
	}

	return metadataRequest, nil

}

func ProcessFieldsMetadata(ctx context.Context, fields map[string]*wire.FieldMetadata, collectionKey string, collection FieldsMap, metadataResponse *wire.MetadataCache, additionalRequests *MetadataRequest, prefix string) error {

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

			// If we only have one field, and it's the id field, skip getting metadata
			if len(collection[fieldKey]) == 1 {
				_, ok := collection[fieldKey][commonfields.Id]
				if ok {
					continue
				}
			}

			// Only add to additional requests if we don't already have that metadata
			refCollection, _ := metadataResponse.GetCollection(referenceMetadata.GetCollection())
			for _, fieldID := range specialRef.Fields {
				if refCollection != nil {
					_, err := refCollection.GetField(fieldID)
					if err == nil {
						continue
					}
				}
				err := additionalRequests.AddField(referenceMetadata.GetCollection(), fieldID, nil)
				if err != nil {
					return err
				}
			}
		}

		if wire.IsReference(fieldMetadata.Type) {

			// If we only have one field, and it's the id field, skip getting metadata
			if len(collection[fieldKey]) == 1 {
				_, ok := collection[fieldKey][commonfields.Id]
				if ok {
					continue
				}
			}

			relatedCollection := fieldMetadata.ReferenceMetadata.GetCollection()
			// Only add to additional requests if we don't already have that metadata
			refCollection, err := metadataResponse.GetCollection(relatedCollection)
			if err != nil {
				err := additionalRequests.AddCollection(relatedCollection)
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
				err := additionalRequests.AddField(relatedCollection, fieldKey, &nestedSubFields)
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
				additionalRequests.AddSelectList(selectListMetadata.Name)
			}
		}

		if fieldMetadata.Type == "MAP" || fieldMetadata.Type == "STRUCT" || fieldMetadata.Type == "LIST" {
			err := ProcessFieldsMetadata(ctx, fieldMetadata.SubFields, collectionKey, collection, metadataResponse, additionalRequests, newKey)
			if err != nil {
				return err
			}
		}

		if fieldMetadata.IsFormula && fieldMetadata.FormulaMetadata != nil {
			fieldDeps, err := formula.GetFormulaFields(ctx, fieldMetadata.FormulaMetadata.Expression)
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

func (mr *MetadataRequest) Load(metadataResponse *wire.MetadataCache, session *sess.Session, connection wire.Connection) error {
	if mr.Options == nil {
		mr.Options = &MetadataRequestOptions{}
	}
	// Keep a list of additional metadata that we need to request in a subsequent call
	additionalRequests := MetadataRequest{
		Options: &MetadataRequestOptions{
			LoadAllFields:    false,
			LoadAccessFields: mr.Options.LoadAccessFields,
		},
	}
	// Implement the old way to make sure it still works
	for collectionKey, collection := range mr.Collections {
		metadata, err := LoadCollectionMetadata(collectionKey, metadataResponse, session, connection)
		if err != nil {
			// Not having access to a collection is not the end of the world.
			// Just don't get the metadata for it and continue.
			if exceptions.IsType[*exceptions.ForbiddenException](err) {
				continue
			}
			return err
		}

		if metadata.IsDynamic() || mr.Options.LoadAllFields {
			err = LoadAllFieldsMetadata(collectionKey, metadata, session, connection)
			if err != nil {
				return err
			}
			metadata.HasAllFields = true
		} else {
			// Automagically add the id field and the name field whether they were requested or not.
			fieldsToLoad := []string{commonfields.Id, commonfields.UniqueKey, metadata.NameField}
			if metadata.AccessField != "" {
				collection.merge(&FieldsMap{
					metadata.AccessField: nil,
				})
			}
			if mr.Options.LoadAccessFields {
				if metadata.RecordChallengeTokens != nil {
					collection.merge(getFieldsForTokens(metadata.RecordChallengeTokens))
				}
			}

			for fieldKey := range collection {
				fieldsToLoad = append(fieldsToLoad, fieldKey)
			}

			err = LoadFieldsMetadata(fieldsToLoad, collectionKey, metadata, session, connection)
			if err != nil {
				// Not having access to a field is not the end of the world.
				// Just don't get the metadata for it and continue.
				if exceptions.IsType[*exceptions.ForbiddenException](err) {
					continue
				}
				return err
			}
		}

		if mr.Options.LoadAccessFields && metadata.AccessField != "" {
			accessFieldMetadata, err := metadata.GetField(metadata.AccessField)
			if err != nil {
				return err
			}
			err = additionalRequests.AddCollection(accessFieldMetadata.ReferenceMetadata.GetCollection())
			if err != nil {
				return err
			}
		}

		err = ProcessFieldsMetadata(session.Context(), metadata.Fields, collectionKey, collection, metadataResponse, &additionalRequests, "")
		if err != nil {
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
