package adapt

import (
	"errors"
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type SaveOp struct {
	CollectionName string
	WireName       string
	Inserts        *ChangeItems
	Updates        *ChangeItems
	Deletes        *ChangeItems
	Options        *SaveOptions
	Error          string
}

type ChangeItems []ChangeItem

type ChangeItem struct {
	FieldChanges loadable.Item
	IsNew        bool
	IDValue      interface{}
	Error        string
	RecordKey    interface{}
}

// Lookup struct
type Lookup struct {
	RefField   string // The name of the reference field to lookup
	MatchField string // The name of the field to use to match based on provided data
}

// UpsertOptions struct
type UpsertOptions struct {
	MatchField    string // The field to pull from the database to determine a match
	MatchTemplate string // The template to use against the provided change data to equal the match field
}

// SaveOptions struct
type SaveOptions struct {
	Upsert  *UpsertOptions
	Lookups []Lookup
}

type SearchFieldFunc func([]string) (string, interface{})

type DefaultIDFunc func() string

type DeleteFunc func(interface{}) error

type ChangeFunc func(interface{}, map[string]interface{}) error

type SetDataFunc func(value interface{}, fieldMetadata *FieldMetadata) (interface{}, error)

// ProcessDeletes function
func ProcessDeletes(request *SaveOp, metadata *MetadataCache, deleteFunc DeleteFunc) error {
	collectionMetadata, err := metadata.GetCollection(request.CollectionName)
	if err != nil {
		return err
	}
	idFieldName := collectionMetadata.IDField

	for _, delete := range *request.Deletes {
		dbID, err := delete.FieldChanges.GetField(idFieldName)
		if err != nil {
			return err
		}

		err = deleteFunc(dbID)
		if err != nil {
			return err
		}
	}
	return nil
}

func SetReferenceData(value interface{}, fieldMetadata *FieldMetadata, metadata *MetadataCache) (interface{}, error) {
	if value == nil {
		return nil, nil
	}

	valueMap, ok := value.(map[string]interface{})
	if !ok {
		return nil, nil
	}

	referencedCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
	if err != nil {
		return nil, err
	}
	refIDField, err := referencedCollectionMetadata.GetIDField()
	if err != nil {
		return nil, err
	}

	fk, ok := valueMap[refIDField.GetFullName()]
	if !ok {
		return nil, errors.New("bad change map for ref field " + fieldMetadata.GetFullName() + " -> " + refIDField.GetFullName())
	}
	return fk, nil
}

func ProcessChanges(
	request *SaveOp,
	metadata *MetadataCache,
	updateFunc ChangeFunc,
	insertFunc ChangeFunc,
	setDataFunc SetDataFunc,
	fieldNameFunc FieldNameFunc,
	searchFieldFunc SearchFieldFunc,
	defaultIDFunc DefaultIDFunc,
) error {

	collectionMetadata, err := metadata.GetCollection(request.CollectionName)
	if err != nil {
		return err
	}

	idTemplate, err := NewFieldChanges(collectionMetadata.IDFormat, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	for _, change := range *request.Changes {

		changeMap := map[string]interface{}{}
		searchableValues := []string{}

		err := change.FieldChanges.Loop(func(fieldID string, value interface{}) error {
			fieldMetadata, err := collectionMetadata.GetField(fieldID)
			if err != nil {
				return err
			}

			if fieldID == collectionMetadata.NameField {
				searchableValues = append(searchableValues, value.(string))
			}

			fieldName, err := fieldNameFunc(fieldMetadata)
			if err != nil {
				return err
			}

			updateValue, err := setDataFunc(value, fieldMetadata)
			if err != nil {
				return err
			}

			changeMap[fieldName] = updateValue
			return nil
		})
		if err != nil {
			return err
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
				return err
			}
		} else {
			newID, err := templating.Execute(idTemplate, change.FieldChanges)
			if err != nil {
				return err
			}

			if newID == "" {
				newID = defaultIDFunc()
			}

			// Make sure to set the id field
			idFieldMetadata, err := collectionMetadata.GetIDField()
			if err != nil {
				return err
			}

			idFieldName, err := fieldNameFunc(idFieldMetadata)
			if err != nil {
				return err
			}

			changeMap[idFieldName] = newID

			err = change.FieldChanges.SetField(idFieldMetadata.GetFullName(), newID)
			if err != nil {
				return err
			}

			err = insertFunc(newID, changeMap)
			if err != nil {
				return err
			}
		}

	}
	return nil

}

// NewFieldChanges function returns a template that can merge field changes
func NewFieldChanges(templateString string, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (*template.Template, error) {
	return templating.NewWithFunc(templateString, func(item loadable.Item, key string) (interface{}, error) {
		fieldMetadata, err := collectionMetadata.GetField(key)
		if err != nil {
			return nil, err
		}
		val, err := item.GetField(key)
		if err != nil {
			return nil, errors.New("missing key " + key)
		}

		if IsReference(fieldMetadata.Type) {
			return SetReferenceData(val, fieldMetadata, metadata)
		}

		return val, nil
	})
}
