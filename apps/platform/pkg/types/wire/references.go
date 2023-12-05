package wire

import "errors"

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
