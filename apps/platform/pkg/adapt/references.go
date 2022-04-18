package adapt

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type ReferenceRequest struct {
	Fields    []LoadRequestField
	FieldsMap map[string]bool
	Metadata  *CollectionMetadata
	IDMap     map[string][]ReferenceLocator
}

type ReferenceLocator struct {
	Item  loadable.Item
	Field *FieldMetadata
}

func (rr *ReferenceRequest) GetIDs() []string {
	ids := make([]string, len(rr.IDMap))
	fieldIDIndex := 0
	for k := range rr.IDMap {
		ids[fieldIDIndex] = k
		fieldIDIndex++
	}
	return ids
}

func (rr *ReferenceRequest) AddID(value interface{}, locator ReferenceLocator) {
	foreignKeyValueAsString, ok := value.(string)
	if ok {
		items, ok := rr.IDMap[foreignKeyValueAsString]
		if !ok {
			rr.IDMap[foreignKeyValueAsString] = []ReferenceLocator{}
		}
		rr.IDMap[foreignKeyValueAsString] = append(items, locator)
	}
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

func HandleReferences(
	connection Connection,
	referencedCollections ReferenceRegistry,
) error {

	for collectionName, ref := range referencedCollections {
		ids := ref.GetIDs()
		idCount := len(ids)
		if idCount == 0 {
			continue
		}
		ref.AddFields([]LoadRequestField{
			{
				ID: ID_FIELD,
			},
		})
		op := &LoadOp{
			Fields:         ref.Fields,
			WireName:       "ReferenceLoad",
			Collection:     &Collection{},
			CollectionName: collectionName,
			Conditions: []LoadRequestCondition{
				{
					Field:    ID_FIELD,
					Operator: "IN",
					Value:    ids,
				},
			},
			Query: true,
		}

		err := connection.Load(op)
		if err != nil {
			return err
		}

		referencedCollection := referencedCollections[op.CollectionName]
		err = op.Collection.Loop(func(refItem loadable.Item, _ string) error {
			refFK, err := refItem.GetField(ID_FIELD)
			if err != nil {
				return err
			}

			refFKAsString, ok := refFK.(string)
			if !ok {
				//Was unable to convert foreign key to a string!
				//Something has gone sideways!
				return err
			}

			if refFKAsString == "" {
				return nil
			}

			matchIndexes, ok := referencedCollection.IDMap[refFKAsString]
			if !ok {
				return nil
			}

			for _, locator := range matchIndexes {
				referenceValue := Item{}
				meta.Copy(&referenceValue, refItem)
				err = locator.Item.SetField(locator.Field.GetFullName(), referenceValue)
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
