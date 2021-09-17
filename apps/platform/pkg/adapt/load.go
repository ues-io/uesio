package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// LoadOp type
type LoadOp struct {
	CollectionName        string                 `json:"collection"`
	WireName              string                 `json:"wire"`
	Collection            loadable.Group         `json:"data"`
	Conditions            []LoadRequestCondition `json:"-"`
	Fields                []LoadRequestField     `json:"-"`
	Type                  string                 `json:"-"`
	Order                 []LoadRequestOrder     `json:"-"`
	Limit                 int                    `json:"-"`
	Offset                int                    `json:"-"`
	ReferencedCollections ReferenceRegistry      `json:"-"`
	UserResponseTokens    []string               `json:"-"`
}

// LoadRequestField struct
type LoadRequestField struct {
	ID     string             `json:"id"`
	Fields []LoadRequestField `json:"fields"`
}

// LoadRequestCondition struct
type LoadRequestCondition struct {
	Field       string      `json:"field"`
	Value       interface{} `json:"value"`
	ValueSource string      `json:"valueSource"`
	Type        string      `json:"type"`
	Operator    string      `json:"operator"`
	LookupWire  string      `json:"lookupWire"`
	LookupField string      `json:"lookupField"`
}

// LoadRequestOrder struct
type LoadRequestOrder struct {
	Field string `json:"field"`
	Desc  bool   `json:"desc"`
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

func (fm *FieldsMap) GetUniqueDBFieldNames(getDBFieldName func(*FieldMetadata) (string, error)) ([]string, error) {
	if len(*fm) == 0 {
		return nil, errors.New("No fields selected")
	}
	dbNamesMap := map[string]bool{}
	for _, fieldMetadata := range *fm {
		dbFieldName, err := getDBFieldName(fieldMetadata)
		if err != nil {
			return nil, err
		}
		dbNamesMap[dbFieldName] = true
	}
	i := 0
	dbNames := make([]string, len(dbNamesMap))
	for k := range dbNamesMap {
		dbNames[i] = k
		i++
	}
	return dbNames, nil
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

		err = fieldIDMap.AddField(fieldMetadata)
		if err != nil {
			return nil, nil, err
		}

		if !IsReference(fieldMetadata.Type) {
			continue
		}

		referencedCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
		if err != nil {
			return nil, nil, errors.New("No matching collection: " + fieldMetadata.ReferencedCollection + " for reference field: " + fieldMetadata.Name)
		}

		refReq := referencedCollections.Get(fieldMetadata.ReferencedCollection)
		refReq.Metadata = referencedCollectionMetadata

		if referencedCollectionMetadata.DataSource != collectionMetadata.DataSource {
			continue
		}
		refReq.AddFields(field.Fields)
		refReq.AddReference(fieldMetadata)
	}
	return fieldIDMap, referencedCollections, nil
}
