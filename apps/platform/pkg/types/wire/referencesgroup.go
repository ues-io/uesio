package wire

type ReferenceGroupRequest struct {
	Fields    []LoadRequestField
	FieldsMap map[string]bool
	Metadata  *CollectionMetadata
	Field     *FieldMetadata
}

type ReferenceGroupRegistry map[string]*ReferenceGroupRequest

func (rr *ReferenceGroupRequest) AddFields(fields []LoadRequestField) {
	for _, field := range fields {
		_, ok := rr.FieldsMap[field.ID]
		if !ok {
			rr.Fields = append(rr.Fields, field)
			rr.FieldsMap[field.ID] = true
		}
	}
}

func (rr *ReferenceGroupRegistry) Add(collectionKey string, fieldMetadata *FieldMetadata, collectionMetadata *CollectionMetadata) *ReferenceGroupRequest {

	rgr := &ReferenceGroupRequest{
		Field:     fieldMetadata,
		Fields:    []LoadRequestField{},
		FieldsMap: map[string]bool{},
		Metadata:  collectionMetadata,
	}

	(*rr)[collectionKey+":"+fieldMetadata.GetFullName()] = rgr

	return rgr
}
