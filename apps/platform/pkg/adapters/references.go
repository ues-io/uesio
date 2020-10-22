package adapters

import "errors"

// ReferenceIDRegistry type
type ReferenceIDRegistry map[string]map[string]bool

// AddValue function
func (rr *ReferenceIDRegistry) AddValue(fieldMetadata *FieldMetadata, value interface{}) {
	rr.AddValueWithKey(fieldMetadata.Name, value)
}

// AddValueWithKey function
func (rr *ReferenceIDRegistry) AddValueWithKey(key string, value interface{}) {
	mapping, ok := (*rr)[key]
	if !ok {
		//Initialize mapping
		mapping = map[string]bool{}
		(*rr)[key] = mapping
	}

	foreignKeyValueAsString, ok := value.(string)
	if ok {
		mapping[foreignKeyValueAsString] = true
	}
}

// GetKeys function
func (rr *ReferenceIDRegistry) GetKeys(key string) []string {
	keyMap := (*rr)[key]
	fieldIDIndex := 0
	fieldIDs := make([]string, len(keyMap))
	for k := range keyMap {
		fieldIDs[fieldIDIndex] = k
		fieldIDIndex++
	}
	return fieldIDs
}

// GetReferenceFieldsAndIDs func
func GetReferenceFieldsAndIDs(
	referenceFields FieldsMap,
	metadata *MetadataCache,
	foreignKeyValues ReferenceIDRegistry,
) (ReferenceIDRegistry, ReferenceIDRegistry, error) {
	//A mapping of our different collections to their fields we will need from those collections
	referencedCollectionsFields := ReferenceIDRegistry{}
	//a mapping of all needed primary keys for the collections we care about
	referencedCollectionsIDs := ReferenceIDRegistry{}
	for _, fieldMetadata := range referenceFields {
		referencedCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
		if err != nil {
			return nil, nil, errors.New("No matching collection: " + fieldMetadata.ReferencedCollection + " for reference field: " + fieldMetadata.Name)
		}
		//TODO:: Pulls these fields from display templates or something
		//TODO:: Make use of this mapping? Should be possible to selectivly retrieve fields in the future.
		referencedCollectionsFields.AddValueWithKey(fieldMetadata.ReferencedCollection, referencedCollectionMetadata.NameField)
		referencedCollectionsFields.AddValueWithKey(fieldMetadata.ReferencedCollection, referencedCollectionMetadata.IDField)

		foreignKeyValuesForRef := foreignKeyValues[fieldMetadata.Name]
		for foreignKeyValue := range foreignKeyValuesForRef {
			referencedCollectionsIDs.AddValueWithKey(fieldMetadata.ReferencedCollection, foreignKeyValue)
		}
	}
	return referencedCollectionsFields, referencedCollectionsIDs, nil
}

// MergeReferenceData func
func MergeReferenceData(
	dataPayload []map[string]interface{},
	referenceFields FieldsMap,
	idToDataMapping map[string]map[string]interface{},
	collectionMetadata *CollectionMetadata,
) error {
	//Merge in data from reference records into the data payload
	for _, data := range dataPayload {
		//For each reference field
		for _, referenceField := range referenceFields {
			if referenceField.ReferencedCollection != collectionMetadata.GetFullName() {
				//Reference field cares about a different collection
				continue
			}
			//We directly use the Uesio name here because we are dealing with a transformed
			//payload already
			fk, ok := data[referenceField.ForeignKeyField]
			if !ok {
				//No value for that reference field to map against
				continue
			}
			fkAsString, ok := fk.(string)
			if !ok {
				//Was unable to convert foreign key to a string!
				//Something has gone sideways!
				continue
			}
			referenceDoc, ok := idToDataMapping[fkAsString]
			if !ok {
				//We found no reference doc corresponding to the foreign key
				continue
			}

			//TODO:: We will want this to handle arbitrary fields in this collection
			//not just the name field
			//Also we use the DBName here because we are dealing with raw Firebase records again
			nameFieldOfReferencedCollection, err := collectionMetadata.GetNameField()
			if err != nil {
				return err
			}
			uiFieldName, err := GetUIFieldName(nameFieldOfReferencedCollection)
			if err != nil {
				return err
			}
			referenceUIFieldName, err := GetUIFieldName(referenceField)
			if err != nil {
				return err
			}
			displayValue, ok := referenceDoc[uiFieldName]
			if !ok {
				//referenced doc had no entry for the name
				continue
			}
			//TODO:: Add other fields here too
			referenceValue := map[string]interface{}{}
			referenceValue[uiFieldName] = displayValue
			data[referenceUIFieldName] = referenceValue
		}
	}
	return nil
}
