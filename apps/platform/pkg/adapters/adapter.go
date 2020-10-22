package adapters

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// Adapter interface
type Adapter interface {
	Load([]reqs.LoadRequest, *MetadataCache, *creds.AdapterCredentials) ([]reqs.LoadResponse, error)
	Save([]reqs.SaveRequest, *MetadataCache, *creds.AdapterCredentials) ([]reqs.SaveResponse, error)
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
	DBFieldName, err := GetUIFieldName(fieldMetadata)
	if err != nil {
		return err
	}

	(*fm)[DBFieldName] = fieldMetadata
	return nil
}

// GetFieldsMap function returns a map of field DB names to field UI names to be used in a load request
func GetFieldsMap(fields []reqs.LoadRequestField, collectionMetadata *CollectionMetadata) (FieldsMap, FieldsMap, error) {
	fieldIDMap := FieldsMap{}
	referenceFields := FieldsMap{}
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

		referenceFields.AddField(fieldMetadata)

		fkMetadata, err := collectionMetadata.GetField(foreignKeyField)
		if err != nil {
			return nil, nil, err
		}

		fieldIDMap.AddField(fkMetadata)
	}
	return fieldIDMap, referenceFields, nil
}
