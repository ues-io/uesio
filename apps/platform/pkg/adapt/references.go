package adapt

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ReferenceRequest type
type ReferenceRequest struct {
	Fields          []LoadRequestField
	Metadata        *CollectionMetadata
	ReferenceFields FieldsMap
	IDs             map[string][]loadable.Item
}

// AddID function
func (rr *ReferenceRequest) AddID(value interface{}, item loadable.Item) {
	foreignKeyValueAsString, ok := value.(string)
	if ok {
		items, ok := rr.IDs[foreignKeyValueAsString]
		if !ok {
			rr.IDs[foreignKeyValueAsString] = []loadable.Item{}
		}
		rr.IDs[foreignKeyValueAsString] = append(items, item)
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
		IDs:             map[string][]loadable.Item{},
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
	return fieldType == "REFERENCE" || fieldType == "FILE"
}

func HandleReferences(
	loader Loader,
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
			Fields:   ref.Fields,
			WireName: "ReferenceLoad",
			Collection: &ReferenceCollection{
				ReferencedCollection: ref,
				CollectionMetadata:   collectionMetadata,
			},
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
	return loader(ops)
}
