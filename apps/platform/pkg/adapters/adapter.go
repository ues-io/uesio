package adapters

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/creds"
)

// LoadOp type
type LoadOp struct {
	CollectionName        string                 `json:"collection"`
	WireName              string                 `json:"wire"`
	Collection            LoadableGroup          `json:"data"`
	Conditions            []LoadRequestCondition `json:"-"`
	Fields                []LoadRequestField     `json:"-"`
	Type                  string                 `json:"-"`
	Order                 []LoadRequestOrder     `json:"-"`
	Limit                 int                    `json:"-"`
	Offset                int                    `json:"-"`
	ReferencedCollections ReferenceRegistry
}

// LoadableGroup interface
type LoadableGroup interface {
	GetItem(index int) LoadableItem
	Loop(iter func(item LoadableItem) error) error
	Len() int
	AddItem(LoadableItem)
	NewItem() LoadableItem
	GetItems() interface{}
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
	(*fm)[fieldMetadata.GetFullName()] = fieldMetadata
	return nil
}

// GetFieldsMap function returns a map of field DB names to field UI names to be used in a load request
func GetFieldsMap(fields []LoadRequestField, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (FieldsMap, ReferenceRegistry, error) {
	fieldIDMap := FieldsMap{}
	referencedCollections := ReferenceRegistry{}
	for _, field := range fields {
		fieldMetadata, err := collectionMetadata.GetField(field.ID)
		if err != nil {
			return nil, nil, err
		}
		if fieldMetadata.Type != "REFERENCE" {
			err := fieldIDMap.AddField(fieldMetadata)
			if err != nil {
				return nil, nil, err
			}
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

		fkMetadata, err := collectionMetadata.GetField(foreignKeyField)
		if err != nil {
			return nil, nil, errors.New("Missing foreign key metadata: " + foreignKeyField)
		}

		// Set the IsForeignKey
		fkMetadata.IsForeignKey = true
		fkMetadata.ReferencedCollection = referencedCollectionMetadata.GetFullName()

		refReq := referencedCollections.Get(referencedCollectionMetadata)

		refReq.AddFields(field.Fields)
		refReq.AddReference(fieldMetadata)

		err = fieldIDMap.AddField(fkMetadata)
		if err != nil {
			return nil, nil, err
		}
	}
	return fieldIDMap, referencedCollections, nil
}
