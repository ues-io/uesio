package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
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

func (lm *LocatorMap) AddID(value interface{}, locator ReferenceLocator) {
	foreignKeyValueAsString, ok := value.(string)
	if ok {
		items, ok := (*lm)[foreignKeyValueAsString]
		if !ok {
			(*lm)[foreignKeyValueAsString] = []ReferenceLocator{}
		}
		(*lm)[foreignKeyValueAsString] = append(items, locator)
	}
}

type ReferenceRequest struct {
	Fields     []LoadRequestField
	FieldsMap  map[string]bool
	Metadata   *CollectionMetadata
	IDMap      LocatorMap
	MatchField string
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

func (rr *ReferenceRequest) AddID(value interface{}, locator ReferenceLocator) {
	rr.IDMap.AddID(value, locator)
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

type ReferenceRegistry map[string]*ReferenceRequest

func (rr *ReferenceRegistry) Add(collectionKey string) {
	(*rr)[collectionKey] = &ReferenceRequest{
		IDMap:     map[string][]ReferenceLocator{},
		Fields:    []LoadRequestField{},
		FieldsMap: map[string]bool{},
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
	skipRecordSecurity bool,
	looper func(loadable.Item, []ReferenceLocator) error,
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
				Value:    ids,
			},
		},
		Query:              true,
		SkipRecordSecurity: skipRecordSecurity,
	}

	err := connection.Load(op)
	if err != nil {
		return err
	}

	return op.Collection.Loop(func(refItem loadable.Item, _ string) error {
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
			return looper(refItem, nil)
		}
		return looper(refItem, matchIndexes)
	})

}

func HandleReferences(
	connection Connection,
	referencedCollections ReferenceRegistry,
	skipRecordSecurity bool,
) error {

	for collectionName, ref := range referencedCollections {
		ids := ref.GetIDs()
		if len(ids) == 0 {
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

		err := LoadLooper(connection, collectionName, ref.IDMap, ref.Fields, ref.GetMatchField(), skipRecordSecurity, func(refItem loadable.Item, matchIndexes []ReferenceLocator) error {

			if matchIndexes == nil {
				return nil
			}

			for _, locator := range matchIndexes {
				referenceValue := &Item{}
				concreteItem := locator.Item.(loadable.Item)
				meta.Copy(referenceValue, refItem)
				err := concreteItem.SetField(locator.Field.GetFullName(), referenceValue)
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
