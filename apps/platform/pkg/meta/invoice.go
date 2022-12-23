package meta

type Invoice struct {
	AutoID string  `json:"uesio/studio.autoid"`
	App    *App    `json:"uesio/studio.app"`
	Date   string  `json:"uesio/studio.date"`
	Total  float64 `json:"uesio/studio.total"`
	BuiltIn
}

func (l *Invoice) GetCollectionName() string {
	return l.GetCollection().GetName()
}

func (l *Invoice) GetCollection() CollectionableGroup {
	return &InvoiceCollection{}
}

func (l *Invoice) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(l, fieldName, value)
}

func (l *Invoice) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(l, fieldName)
}

func (l *Invoice) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(l, iter)
}

func (l *Invoice) Len() int {
	return StandardItemLen(l)
}
