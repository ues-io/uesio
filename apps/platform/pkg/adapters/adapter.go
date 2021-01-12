package adapters

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/creds"
)

// LoadOp type
type LoadOp struct {
	CollectionName string                 `json:"collection"`
	WireName       string                 `json:"wire"`
	Collection     LoadableGroup          `json:"data"`
	Conditions     []LoadRequestCondition `json:"-"`
	Fields         []LoadRequestField     `json:"-"`
	Type           string                 `json:"-"`
	Order          []LoadRequestOrder     `json:"-"`
}

// LoadableGroup interface
type LoadableGroup interface {
	GetItem(index int) LoadableItem
	Loop(iter func(item LoadableItem) error) error
	Len() int
	AddItem(LoadableItem)
	NewItem() LoadableItem
}

// LoadableItem interface
type LoadableItem interface {
	SetField(string, interface{}) error
	GetField(string) (interface{}, error)
}

// Adapter interface
type Adapter interface {
	Load([]LoadOp, *MetadataCache, *creds.AdapterCredentials) error
	Save([]SaveRequest, *MetadataCache, *creds.AdapterCredentials) ([]SaveResponse, error)
	Migrate(*MetadataCache, *creds.AdapterCredentials) error
}

var adapterMap = map[string]Adapter{}

// GetAdapter gets an adapter of a certain type
func GetAdapter(adapterType string) (Adapter, error) {
	adapter, ok := adapterMap[adapterType]
	if !ok {
		return nil, errors.New("No adapter found of this type: " + adapterType)
	}
	return adapter, nil
}

// RegisterAdapter function
func RegisterAdapter(name string, adapter Adapter) {
	adapterMap[name] = adapter
}

func getStringWithDefault(field string, defaultField string) string {
	if field != "" {
		return field
	}
	return defaultField
}

// GetUIFieldName function
func GetUIFieldName(fieldMetadata *FieldMetadata) (string, error) {
	if fieldMetadata.Namespace == "" || fieldMetadata.Name == "" {
		return "", errors.New("Could not get DB Field Name: Missing important field metadata: " + fieldMetadata.Name)
	}
	return fieldMetadata.Namespace + "." + fieldMetadata.Name, nil
}

// FieldsMap type
type FieldsMap map[string]*FieldMetadata

// GetKeys function
func (fm *FieldsMap) GetKeys() []string {
	fieldIDIndex := 0
	fieldIDs := make([]string, len(*fm))
	for k := range *fm {
		fieldIDs[fieldIDIndex] = k
		fieldIDIndex++
	}
	return fieldIDs
}

// AddField function
func (fm *FieldsMap) AddField(fieldMetadata *FieldMetadata) error {
	fieldName, err := GetUIFieldName(fieldMetadata)
	if err != nil {
		return err
	}

	(*fm)[fieldName] = fieldMetadata
	return nil
}

// GetFieldsMap function returns a map of field DB names to field UI names to be used in a load request
func GetFieldsMap(fields []LoadRequestField, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (FieldsMap, ReferenceRegistry, error) {
	fieldIDMap := FieldsMap{}
	referenceFields := ReferenceRegistry{}
	for _, field := range fields {
		fieldMetadata, err := collectionMetadata.GetField(field.ID)
		if err != nil {
			return nil, nil, err
		}
		if fieldMetadata.Type != "REFERENCE" {
			fieldIDMap.AddField(fieldMetadata)
			continue
		}

		//Make sure we fetch the foreign key - otherwise we can't always do a mapping
		foreignKeyField := fieldMetadata.ForeignKeyField
		if foreignKeyField == "" {
			return nil, nil, errors.New("No foreign key field configured for reference field: " + fieldMetadata.Name)
		}

		referencedCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
		if err != nil {
			return nil, nil, errors.New("No matching collection: " + fieldMetadata.ReferencedCollection + " for reference field: " + fieldMetadata.Name)
		}

		subFields := append(field.Fields, LoadRequestField{
			ID: referencedCollectionMetadata.IDField,
		}, LoadRequestField{
			ID: referencedCollectionMetadata.NameField,
		})

		referenceFields.Add(fieldMetadata, subFields)

		fkMetadata, err := collectionMetadata.GetField(foreignKeyField)
		if err != nil {
			return nil, nil, err
		}

		fieldIDMap.AddField(fkMetadata)
	}
	return fieldIDMap, referenceFields, nil
}
