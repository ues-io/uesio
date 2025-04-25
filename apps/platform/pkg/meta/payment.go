package meta

type Payment struct {
	BuiltIn `yaml:",inline"`
	AutoID  string  `json:"uesio/studio.autoid"`
	User    *User   `json:"uesio/studio.user"`
	Date    string  `json:"uesio/studio.date"`
	Total   float64 `json:"uesio/studio.total"`
	Payment string  `json:"uesio/studio.payment"`
}

func (l *Payment) GetCollection() CollectionableGroup {
	return &PaymentCollection{}
}

func (l *Payment) GetCollectionName() string {
	return PAYMENT_COLLECTION_NAME
}

func (l *Payment) SetField(fieldName string, value any) error {
	return StandardFieldSet(l, fieldName, value)
}

func (l *Payment) GetField(fieldName string) (any, error) {
	return StandardFieldGet(l, fieldName)
}

func (l *Payment) Loop(iter func(string, any) error) error {
	return StandardItemLoop(l, iter)
}

func (l *Payment) Len() int {
	return StandardItemLen(l)
}
