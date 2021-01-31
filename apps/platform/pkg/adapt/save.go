package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/templating"
)

type SearchFieldFunc func([]string) (string, interface{})

type DefaultIDFunc func() string

type DeleteFunc func(string) error

type ChangeFunc func(interface{}, map[string]interface{}) error

type SetDataFunc func(value interface{}, fieldMetadata *FieldMetadata) (interface{}, error)

// ProcessDeletes function
func ProcessDeletes(request *SaveRequest, metadata *MetadataCache, deleteFunc DeleteFunc) (map[string]ChangeResult, error) {
	collectionMetadata, err := metadata.GetCollection(request.Collection)
	if err != nil {
		return nil, err
	}
	idFieldName := collectionMetadata.IDField
	deleteResults := map[string]ChangeResult{}
	for deleteID, delete := range request.Deletes {
		deleteResult := ChangeResult{}
		deleteResult.Data = map[string]interface{}{}

		dbID, ok := delete[idFieldName].(string)
		if ok {
			err := deleteFunc(dbID)
			if err != nil {
				return nil, err
			}
			deleteResult.Data[idFieldName] = dbID
		} else {
			return nil, errors.New("No id provided for delete")
		}

		deleteResults[deleteID] = deleteResult
	}
	return deleteResults, nil
}

func SetReferenceData(value interface{}, fieldMetadata *FieldMetadata) (interface{}, error) {
	if value == nil {
		return nil, nil
	}

	valueMap, ok := value.(map[string]interface{})
	if !ok {
		return nil, nil
	}
	var refValue interface{}
	for i := range valueMap {
		refValue, ok = valueMap[i]
		if !ok {
			return nil, nil
		}
		break
	}
	return refValue, nil
}

func ProcessChanges(
	request *SaveRequest,
	metadata *MetadataCache,
	updateFunc ChangeFunc,
	insertFunc ChangeFunc,
	setDataFunc SetDataFunc,
	fieldNameFunc FieldNameFunc,
	searchFieldFunc SearchFieldFunc,
	defaultIDFunc DefaultIDFunc,
) (map[string]ChangeResult, error) {
	changeResults := map[string]ChangeResult{}

	collectionMetadata, err := metadata.GetCollection(request.Collection)
	if err != nil {
		return nil, err
	}

	idTemplate, err := templating.New(collectionMetadata.IDFormat)
	if err != nil {
		return nil, err
	}

	for changeID, change := range request.Changes {

		changeResult := NewChangeResult(change)

		changeMap := map[string]interface{}{}
		searchableValues := []string{}

		for fieldID, value := range change.FieldChanges {
			fieldMetadata, err := collectionMetadata.GetField(fieldID)
			if err != nil {
				return nil, err
			}

			if fieldID == collectionMetadata.NameField {
				searchableValues = append(searchableValues, value.(string))
			}

			fieldName, err := fieldNameFunc(fieldMetadata)
			if err != nil {
				return nil, err
			}

			updateValue, err := setDataFunc(value, fieldMetadata)
			if err != nil {
				return nil, err
			}

			changeMap[fieldName] = updateValue

		}

		if searchFieldFunc != nil && len(searchableValues) > 0 {
			searchIndexField, searchIndex := searchFieldFunc(searchableValues)
			if searchIndexField != "" {
				changeMap[searchIndexField] = searchIndex
			}
		}

		if !change.IsNew && change.IDValue != nil {
			err := updateFunc(change.IDValue, changeMap)
			if err != nil {
				return nil, err
			}
		} else {
			newID, err := templating.Execute(idTemplate, change.FieldChanges)
			if err != nil {
				return nil, err
			}

			if newID == "" {
				newID = defaultIDFunc()
			}

			// Make sure to set the id field
			idFieldMetadata, err := collectionMetadata.GetIDField()
			if err != nil {
				return nil, err
			}

			idFieldName, err := fieldNameFunc(idFieldMetadata)
			if err != nil {
				return nil, err
			}

			changeMap[idFieldName] = newID

			err = insertFunc(newID, changeMap)
			if err != nil {
				return nil, err
			}

			changeResult.Data[collectionMetadata.IDField] = newID
		}

		changeResults[changeID] = changeResult

	}
	return changeResults, nil

}
