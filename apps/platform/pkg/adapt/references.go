package adapt

import "github.com/thecloudmasters/uesio/pkg/meta/loadable"

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
	return fieldType == "REFERENCE" || fieldType == "FILE"
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
			Fields:   ref.Fields,
			WireName: "ReferenceLoad",
			Collection: &ReferenceCollection{
				ReferencedCollection: ref,
				Collection:           collection,
				CollectionMetadata:   collectionMetadata,
				NewCollection:        Collection{},
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
