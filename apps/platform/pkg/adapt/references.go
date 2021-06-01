package adapt

import (
	"github.com/jinzhu/copier"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ReferenceRequest type
type ReferenceRequest struct {
	Fields          []LoadRequestField
	Metadata        *CollectionMetadata
	ReferenceFields FieldsMap
	IDs             map[string][]int
}

// AddID function
func (rr *ReferenceRequest) AddID(value interface{}, index int) {
	foreignKeyValueAsString, ok := value.(string)
	if ok {
		items, ok := rr.IDs[foreignKeyValueAsString]
		if !ok {
			rr.IDs[foreignKeyValueAsString] = []int{}
		}
		rr.IDs[foreignKeyValueAsString] = append(items, index)
	}
}

// AddFields function
func (rr *ReferenceRequest) AddFields(fields []LoadRequestField) {
	rr.Fields = append(rr.Fields, fields...)
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
		IDs:             map[string][]int{},
		Fields:          []LoadRequestField{},
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

type Loader func([]LoadOp) error

func IsReference(fieldType string) bool {
	return fieldType == "REFERENCE" || fieldType == "FILE" || fieldType == "USER"
}

func HandleReferences(
	loader Loader,
	collection loadable.Group,
	referencedCollections ReferenceRegistry,
) error {
	ops := []LoadOp{}
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
		ops = append(ops, LoadOp{
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
		})
	}
	err := loader(ops)
	if err != nil {
		return nil
	}

	for i := range ops {
		op := ops[i]
		referencedCollection := referencedCollections[op.CollectionName]
		err := op.Collection.Loop(func(refItem loadable.Item) error {
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

			for _, index := range matchIndexes {
				for _, reference := range referencedCollection.ReferenceFields {
					referenceValue := Item{}

					err = copier.Copy(&referenceValue, refItem)
					if err != nil {
						return err
					}

					item := collection.GetItem(index)
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
