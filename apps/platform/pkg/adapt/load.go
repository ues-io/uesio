package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type LoadOp struct {
	CollectionName     string                 `json:"collection"`
	WireName           string                 `json:"wire"`
	Collection         loadable.Group         `json:"data"`
	Conditions         []LoadRequestCondition `json:"-"`
	Fields             []LoadRequestField     `json:"-"`
	Query              bool                   `json:"-"`
	Order              []LoadRequestOrder     `json:"-"`
	BatchSize          int                    `json:"-"`
	BatchNumber        int                    `json:"batchnumber"`
	HasMoreBatches     bool                   `json:"more"`
	SkipRecordSecurity bool                   `json:"-"`
	RequireWriteAccess bool                   `json:"-"`
}

type LoadRequestField struct {
	ID     string             `json:"id" bot:"id"`
	Fields []LoadRequestField `json:"fields" bot:"fields"`
}

type LoadRequestCondition struct {
	Field         string                 `json:"field" bot:"field"`
	Value         interface{}            `json:"value" bot:"value"`
	ValueSource   string                 `json:"valueSource"`
	Type          string                 `json:"type"`
	Operator      string                 `json:"operator"`
	LookupWire    string                 `json:"lookupWire"`
	LookupField   string                 `json:"lookupField"`
	SearchFields  []string               `json:"fields"`
	SubConditions []LoadRequestCondition `json:"conditions"`
	Conjunction   string                 `json:"conjunction"`
}

type LoadRequestOrder struct {
	Field string `json:"field" bot:"field"`
	Desc  bool   `json:"desc" bot:"desc"`
}

type FieldsMap map[string]*FieldMetadata

func (fm *FieldsMap) GetKeys() []string {
	fieldIDIndex := 0
	fieldIDs := make([]string, len(*fm))
	for k := range *fm {
		fieldIDs[fieldIDIndex] = k
		fieldIDIndex++
	}
	return fieldIDs
}

var ID_FIELD = "uesio/core.id"
var UNIQUE_KEY_FIELD = "uesio/core.uniquekey"

func (fm *FieldsMap) GetUniqueDBFieldNames(getDBFieldName func(*FieldMetadata) string) ([]string, error) {
	if len(*fm) == 0 {
		return nil, errors.New("No fields selected")
	}
	dbNamesMap := map[string]bool{}
	for _, fieldMetadata := range *fm {
		dbFieldName := getDBFieldName(fieldMetadata)
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

func (fm *FieldsMap) AddField(fieldMetadata *FieldMetadata) error {
	(*fm)[fieldMetadata.GetFullName()] = fieldMetadata
	return nil
}

func GetFieldsMap(fields []LoadRequestField, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (FieldsMap, ReferenceRegistry, ReferenceGroupRegistry, map[string]*FieldMetadata, error) {
	fieldIDMap := FieldsMap{}
	referencedCollections := ReferenceRegistry{}
	referencedGroupCollections := ReferenceGroupRegistry{}
	formulaFields := map[string]*FieldMetadata{}
	for _, field := range fields {
		fieldMetadata, err := collectionMetadata.GetField(field.ID)
		if err != nil {
			return nil, nil, nil, nil, err
		}

		if fieldMetadata.IsFormula {
			formulaFields[fieldMetadata.GetFullName()] = fieldMetadata
			continue
		}

		err = fieldIDMap.AddField(fieldMetadata)
		if err != nil {
			return nil, nil, nil, nil, err
		}

		if IsReference(fieldMetadata.Type) {
			referencedCollection := fieldMetadata.ReferenceMetadata.Collection

			referencedCollectionMetadata, err := metadata.GetCollection(referencedCollection)
			if err != nil {
				continue
			}

			refReq := referencedCollections.Get(referencedCollection)
			refReq.Metadata = referencedCollectionMetadata

			if referencedCollectionMetadata.DataSource != collectionMetadata.DataSource {
				continue
			}
			refReq.AddFields(field.Fields)
		}

		if fieldMetadata.Type == "REFERENCEGROUP" {
			referencedCollection := fieldMetadata.ReferenceGroupMetadata.Collection
			referencedCollectionMetadata, err := metadata.GetCollection(referencedCollection)
			if err != nil {
				continue
			}
			refReq := referencedGroupCollections.Add(referencedCollection, fieldMetadata, referencedCollectionMetadata)
			if referencedCollectionMetadata.DataSource != collectionMetadata.DataSource {
				continue
			}
			refReq.AddFields(field.Fields)
		}

	}
	return fieldIDMap, referencedCollections, referencedGroupCollections, formulaFields, nil
}
