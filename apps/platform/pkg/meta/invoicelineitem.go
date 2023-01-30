package meta

type InvoiceLineItem struct {
	BuiltIn     `yaml:",inline"`
	Invoice     *Invoice `json:"uesio/studio.invoice"`
	Description string   `json:"uesio/studio.description"`
	Quantity    int64    `json:"uesio/studio.quantity"`
	Price       float64  `json:"uesio/studio.price"`
	Total       float64  `json:"uesio/studio.total"`
}

func (l *InvoiceLineItem) GetCollectionName() string {
	return INVOICELINEITEM_COLLECTION_NAME
}

func (l *InvoiceLineItem) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(l, fieldName, value)
}

func (l *InvoiceLineItem) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(l, fieldName)
}

func (l *InvoiceLineItem) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(l, iter)
}

func (l *InvoiceLineItem) Len() int {
	return StandardItemLen(l)
}
