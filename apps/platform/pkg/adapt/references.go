package adapt

// ReferenceRequest type
type ReferenceRequest struct {
	Fields          []LoadRequestField
	Metadata        *CollectionMetadata
	ReferenceFields FieldsMap
	IDs             map[string]bool
}

// AddID function
func (rr *ReferenceRequest) AddID(value interface{}) {
	foreignKeyValueAsString, ok := value.(string)
	if ok {
		rr.IDs[foreignKeyValueAsString] = true
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
func (rr *ReferenceRegistry) Add(collectionMetadata *CollectionMetadata) {
	(*rr)[collectionMetadata.GetFullName()] = &ReferenceRequest{
		Metadata:        collectionMetadata,
		ReferenceFields: FieldsMap{},
		IDs:             map[string]bool{},
		Fields: []LoadRequestField{
			{
				ID: collectionMetadata.IDField,
			},
			{
				ID: collectionMetadata.NameField,
			},
		},
	}
}

// Get function
func (rr *ReferenceRegistry) Get(collectionMetadata *CollectionMetadata) *ReferenceRequest {
	request, ok := (*rr)[collectionMetadata.GetFullName()]
	if !ok {
		rr.Add(collectionMetadata)
		return (*rr)[collectionMetadata.GetFullName()]
	}

	return request
}

type Loader func(*LoadOp, *MetadataCache) error

func HandleReferences(
	loader Loader,
	op *LoadOp,
	metadata *MetadataCache,
	referencedCollections ReferenceRegistry,
) error {
	if op.Collection.Len() == 0 {
		return nil
	}
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
		collectionMetadata, err := metadata.GetCollection(collectionName)
		if err != nil {
			return err
		}
		refOp := &LoadOp{
			Fields:   ref.Fields,
			WireName: "ReferenceLoad",
			Collection: &ReferenceCollection{
				Collection:           op.Collection,
				ReferencedCollection: ref,
				CollectionMetadata:   collectionMetadata,
				NewCollection:        &Collection{},
			},
			CollectionName: collectionName,
			Conditions: []LoadRequestCondition{
				{
					Field:    collectionMetadata.IDField,
					Operator: "IN",
					Value:    ids,
				},
			},
		}
		err = loader(refOp, metadata)
		if err != nil {
			return err
		}
	}
	return nil
}
