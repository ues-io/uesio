package adapt

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type LocatorMap map[string][]ReferenceLocator

func (lm *LocatorMap) GetIDs() []string {
	ids := make([]string, len(*lm))
	fieldIDIndex := 0
	for k := range *lm {
		ids[fieldIDIndex] = k
		fieldIDIndex++
	}
	return ids
}

func (lm *LocatorMap) AddID(value string, locator ReferenceLocator) error {

	if value == "" {
		return errors.New("Cannot add blank id to locator map")
	}
	items, ok := (*lm)[value]
	if !ok {
		(*lm)[value] = []ReferenceLocator{}
	}
	(*lm)[value] = append(items, locator)
	return nil

}

type ReferenceRequest struct {
	Fields     []LoadRequestField
	FieldsMap  map[string]bool
	Metadata   *CollectionMetadata
	IDMap      LocatorMap
	MatchField string
	RefFields  map[string]*FieldMetadata
}

type ReferenceLocator struct {
	Item  interface{}
	Field *FieldMetadata
}

func (rr *ReferenceRequest) GetIDs() []string {
	return rr.IDMap.GetIDs()
}

func (rr *ReferenceRequest) GetMatchField() string {
	if rr.MatchField != "" {
		return rr.MatchField
	}
	return ID_FIELD
}

func (rr *ReferenceRequest) AddID(value string, locator ReferenceLocator) error {
	return rr.IDMap.AddID(value, locator)
}

func (rr *ReferenceRequest) AddFields(fields []LoadRequestField) {
	for _, field := range fields {
		_, ok := rr.FieldsMap[field.ID]
		if !ok {
			rr.Fields = append(rr.Fields, field)
			rr.FieldsMap[field.ID] = true
		}
	}
}

func (rr *ReferenceRequest) AddRefField(field *FieldMetadata) {
	_, ok := rr.RefFields[field.GetFullName()]
	if !ok {
		rr.RefFields[field.GetFullName()] = field
	}
}

type ReferenceRegistry map[string]*ReferenceRequest

func (rr *ReferenceRegistry) Add(collectionKey string) {
	(*rr)[collectionKey] = &ReferenceRequest{
		IDMap:     map[string][]ReferenceLocator{},
		Fields:    []LoadRequestField{},
		FieldsMap: map[string]bool{},
		RefFields: map[string]*FieldMetadata{},
	}
}

func (rr *ReferenceRegistry) Get(collectionKey string) *ReferenceRequest {
	request, ok := (*rr)[collectionKey]
	if !ok {
		rr.Add(collectionKey)
		return (*rr)[collectionKey]
	}

	return request
}

type Loader func([]*LoadOp) error

func IsReference(fieldType string) bool {
	return fieldType == "REFERENCE" || fieldType == "FILE" || fieldType == "USER"
}

func LoadLooper(
	connection Connection,
	collectionName string,
	idMap LocatorMap,
	fields []LoadRequestField,
	matchField string,
	session *sess.Session,
	looper func(meta.Item, []ReferenceLocator, string) error,
) error {
	ids := idMap.GetIDs()
	if len(ids) == 0 {
		return errors.New("No ids provided for load looper")
	}
	op := &LoadOp{
		Fields:         fields,
		WireName:       "LooperLoad",
		Collection:     &Collection{},
		CollectionName: collectionName,
		Conditions: []LoadRequestCondition{
			{
				Field:    matchField,
				Operator: "IN",
				Values:   ids,
			},
		},
		Query: true,
	}

	err := connection.Load(op, session)
	if err != nil {
		return err
	}

	err = op.Collection.Loop(func(refItem meta.Item, _ string) error {
		refFK, err := refItem.GetField(matchField)
		if err != nil {
			return err
		}

		refFKAsString, ok := refFK.(string)
		if !ok {
			//Was unable to convert foreign key to a string!
			//Something has gone sideways!
			return err
		}

		matchIndexes, ok := idMap[refFKAsString]
		if !ok {
			return looper(refItem, nil, refFKAsString)
		}
		// Remove the id from the map, so we can figure out which ones weren't used
		delete(idMap, refFKAsString)
		return looper(refItem, matchIndexes, refFKAsString)
	})
	if err != nil {
		return err
	}
	// If we still have values in our idMap, then we didn't find some of our references.
	for id, locator := range idMap {
		return looper(nil, locator, id)
	}
	return nil

}

func HandleReferences(
	connection Connection,
	referencedCollections ReferenceRegistry,
	session *sess.Session,
	allowMissingItems bool,
) error {

	for collectionName, ref := range referencedCollections {

		if len(ref.IDMap) == 0 {
			continue
		}

		ref.AddFields([]LoadRequestField{
			{
				ID: ID_FIELD,
			},
			{
				ID: UNIQUE_KEY_FIELD,
			},
		})

		err := LoadLooper(connection, collectionName, ref.IDMap, ref.Fields, ref.GetMatchField(), session, func(refItem meta.Item, matchIndexes []ReferenceLocator, ID string) error {

			// This is a weird situation.
			// It means we found a value that we didn't ask for.
			// refItem will be that strange item.
			if matchIndexes == nil {
				return nil
			}

			// This means we tried to load some references, but they don't exist.
			if refItem == nil {
				if allowMissingItems {
					return nil
				}
				return fmt.Errorf("Missing Reference Item For Key: %s on %s -> %s", ID, collectionName, ref.GetMatchField())
			}

			// Loop over all matchIndexes and copy the data from the refItem
			for _, locator := range matchIndexes {
				referenceValue := &Item{}
				concreteItem := locator.Item.(meta.Item)
				err := meta.Copy(referenceValue, refItem)
				if err != nil {
					return err
				}
				err = concreteItem.SetField(locator.Field.GetFullName(), referenceValue)
				if err != nil {
					return err
				}
			}
			return nil
		})
		if err != nil {
			return err
		}
	}

	return nil
}
