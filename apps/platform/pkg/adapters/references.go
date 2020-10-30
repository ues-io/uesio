package adapters

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ReferenceRequest type
type ReferenceRequest struct {
	Fields   []reqs.LoadRequestField
	Metadata *FieldMetadata
	IDs      map[string]bool
}

// AddID function
func (rr *ReferenceRequest) AddID(value interface{}) {
	if rr.IDs == nil {
		//Initialize mapping
		rr.IDs = map[string]bool{}
	}
	foreignKeyValueAsString, ok := value.(string)
	if ok {
		rr.IDs[foreignKeyValueAsString] = true
	}
}

// ReferenceRegistry type
type ReferenceRegistry map[string]*ReferenceRequest

// Add function
func (rr *ReferenceRegistry) Add(fieldMetadata *FieldMetadata, fields []reqs.LoadRequestField) error {
	fieldName, err := GetUIFieldName(fieldMetadata)
	if err != nil {
		return err
	}

	(*rr)[fieldName] = &ReferenceRequest{
		Metadata: fieldMetadata,
		Fields:   fields,
	}
	return nil
}

// ReferenceIDRegistry type
type ReferenceIDRegistry map[string]map[string]bool

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
	referenceFields ReferenceRegistry,
) (ReferenceIDRegistry, ReferenceIDRegistry, error) {
	//A mapping of our different collections to their fields we will need from those collections
	referencedCollectionsFields := ReferenceIDRegistry{}
	//a mapping of all needed primary keys for the collections we care about
	referencedCollectionsIDs := ReferenceIDRegistry{}
	for _, reference := range referenceFields {
		fieldMetadata := reference.Metadata
		for _, field := range reference.Fields {
			referencedCollectionsFields.AddValueWithKey(fieldMetadata.ReferencedCollection, field.ID)
		}
		for foreignKeyValue := range reference.IDs {
			referencedCollectionsIDs.AddValueWithKey(fieldMetadata.ReferencedCollection, foreignKeyValue)
		}
	}
	return referencedCollectionsFields, referencedCollectionsIDs, nil
}

// MergeReferenceData func
func MergeReferenceData(
	dataPayload []map[string]interface{},
	referenceFields ReferenceRegistry,
	idToDataMapping map[string]map[string]interface{},
	collectionMetadata *CollectionMetadata,
) error {
	//Merge in data from reference records into the data payload
	for _, data := range dataPayload {
		//For each reference field
		for _, reference := range referenceFields {
			referenceField := reference.Metadata
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

			referenceValue := map[string]interface{}{}

			for _, field := range reference.Fields {
				displayValue, ok := referenceDoc[field.ID]
				if !ok {
					//referenced doc had no entry for the name
					continue
				}
				referenceValue[field.ID] = displayValue
			}

			referenceUIFieldName, err := GetUIFieldName(referenceField)
			if err != nil {
				return err
			}

			data[referenceUIFieldName] = referenceValue
		}
	}
	return nil
}
