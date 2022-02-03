package adapt

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ReferenceRequest type
type ReferenceRequest struct {
	Fields          []LoadRequestField
	FieldsMap       map[string]bool
	Metadata        *CollectionMetadata
	ReferenceFields FieldsMap
	IDs             map[string][]ReferenceLocator
}

type ReferenceLocator struct {
	RecordIndex int
	Field       *FieldMetadata
}

// AddID function
func (rr *ReferenceRequest) AddID(value interface{}, locator ReferenceLocator) {
	foreignKeyValueAsString, ok := value.(string)
	if ok {
		items, ok := rr.IDs[foreignKeyValueAsString]
		if !ok {
			rr.IDs[foreignKeyValueAsString] = []ReferenceLocator{}
		}
		rr.IDs[foreignKeyValueAsString] = append(items, locator)
	}
}

// AddFields function
func (rr *ReferenceRequest) AddFields(fields []LoadRequestField) {
	for _, field := range fields {
		_, ok := rr.FieldsMap[field.ID]
		if !ok {
			rr.Fields = append(rr.Fields, field)
			rr.FieldsMap[field.ID] = true
		}
	}
}

// AddReference function
func (rr *ReferenceRequest) AddReference(reference *FieldMetadata) {
	rr.ReferenceFields[reference.GetFullName()] = reference
}

// ReferenceRegistry type
type ReferenceRegistry map[string]*ReferenceRequest

// Add function
func (rr *ReferenceRegistry) Add(collectionKey string) {
	(*rr)[collectionKey] = &ReferenceRequest{
		ReferenceFields: FieldsMap{},
		IDs:             map[string][]ReferenceLocator{},
		Fields:          []LoadRequestField{},
		FieldsMap:       map[string]bool{},
	}
}

// Get function
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
	loader Loader,
	collection loadable.Group,
	referencedCollections ReferenceRegistry,
) error {
	ops := []*LoadOp{}
	for collectionName, ref := range referencedCollections {
		idCount := len(ref.IDs)
		if idCount == 0 {
			continue
		}
		ids := make([]string, idCount)
		fieldIDIndex := 0
		for k := range ref.IDs {
			ids[fieldIDIndex] = k
			fieldIDIndex++
		}
		collectionMetadata := ref.Metadata
		ref.AddFields([]LoadRequestField{
			{
				ID: collectionMetadata.IDField,
			},
		})
		ops = append(ops, &LoadOp{
			Fields:         ref.Fields,
			WireName:       "ReferenceLoad",
			Collection:     &Collection{},
			CollectionName: collectionName,
			Conditions: []LoadRequestCondition{
				{
					Field:    collectionMetadata.IDField,
					Operator: "IN",
					Value:    ids,
				},
			},
			Query: true,
		})
	}
	err := loader(ops)
	if err != nil {
		return err
	}

	for i := range ops {
		op := ops[i]
		referencedCollection := referencedCollections[op.CollectionName]
		err := op.Collection.Loop(func(refItem loadable.Item, _ interface{}) error {
			refFK, err := refItem.GetField(referencedCollection.Metadata.IDField)
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

			matchIndexes, ok := referencedCollection.IDs[refFKAsString]
			if !ok {
				return nil
			}

			for _, locator := range matchIndexes {
				for _, reference := range referencedCollection.ReferenceFields {
					if reference != locator.Field {
						continue
					}
					referenceValue := Item{}

					meta.Copy(&referenceValue, refItem)

					item := collection.GetItem(locator.RecordIndex)
					err = item.SetField(reference.GetFullName(), referenceValue)
					if err != nil {
						return err
					}
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
