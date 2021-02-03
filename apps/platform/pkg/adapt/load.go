package adapt

import (
	"errors"
)

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

func HydrateItem(
	op *LoadOp,
	collectionMetadata *CollectionMetadata,
	fieldMap *FieldsMap,
	references *ReferenceRegistry,
	itemID string,
	index int,
	dataFunc DataFunc,
) error {
	item := op.Collection.NewItem()

	for fieldID, fieldMetadata := range *fieldMap {
		fieldData, err := dataFunc(fieldMetadata)
		if err != nil {
			continue
		}

		if IsReference(fieldMetadata.Type) {
			if fieldData == nil {
				err = item.SetField(fieldID, fieldData)
				if err != nil {
					return err
				}
				continue
			}
			// Handle foreign key value
			reference, ok := (*references)[fieldMetadata.ReferencedCollection]
			if !ok {
				continue
			}
			if len(reference.Fields) == 0 {
				refItem := Item{}
				err := refItem.SetField(reference.Metadata.IDField, fieldData)
				if err != nil {
					return err
				}
				err = item.SetField(fieldID, refItem)
				if err != nil {
					return err
				}
			} else {
				reference.AddID(fieldData, index)
			}
			continue
		}

		err = item.SetField(fieldID, fieldData)
		if err != nil {
			return err
		}
	}

	if itemID != "" {
		err := item.SetField(collectionMetadata.IDField, itemID)
		if err != nil {
			return err
		}
	}

	op.Collection.AddItem(item)
	return nil
}
