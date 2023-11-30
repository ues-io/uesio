package adapt

import (
	"errors"
	"sort"

	"github.com/thecloudmasters/uesio/pkg/goutils"
)

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

func (fm *FieldsMap) GetUniqueDBFieldNames(getDBFieldName func(*FieldMetadata) string) ([]string, error) {
	if len(*fm) == 0 {
		return nil, errors.New("No fields selected")
	}
	dbNamesMap := map[string]struct{}{}
	for _, fieldMetadata := range *fm {
		dbFieldName := getDBFieldName(fieldMetadata)
		dbNamesMap[dbFieldName] = struct{}{}
	}
	dbNames := goutils.MapKeys(dbNamesMap)
	sort.Strings(dbNames)
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

			refReq.AddRefField(fieldMetadata)

			if referencedCollectionMetadata.Integration != collectionMetadata.Integration {
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
			if referencedCollectionMetadata.Integration != collectionMetadata.Integration {
				continue
			}
			refReq.AddFields(field.Fields)
		}

	}
	return fieldIDMap, referencedCollections, referencedGroupCollections, formulaFields, nil
}
