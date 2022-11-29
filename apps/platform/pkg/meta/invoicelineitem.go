package meta

type InvoiceLineItem struct {
	ID          string    `json:"uesio/core.id"`
	UniqueKey   string    `json:"uesio/core.uniquekey"`
	Invoice     *Invoice  `json:"uesio/studio.invoice"`
	Description string    `json:"uesio/studio.description"`
	Quantity    int64     `json:"uesio/studio.quantity"`
	Price       float64   `json:"uesio/studio.price"`
	Total       float64   `json:"uesio/studio.total"`
	itemMeta    *ItemMeta `json:"-"`
	CreatedBy   *User     `json:"uesio/core.createdby"`
	Owner       *User     `json:"uesio/core.owner"`
	UpdatedBy   *User     `json:"uesio/core.updatedby"`
	UpdatedAt   int64     `json:"uesio/core.updatedat"`
	CreatedAt   int64     `json:"uesio/core.createdat"`
}

func (l *InvoiceLineItem) GetCollectionName() string {
	return l.GetCollection().GetName()
}

func (l *InvoiceLineItem) GetCollection() CollectionableGroup {
	return &InvoiceCollection{}
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

func (l *InvoiceLineItem) GetItemMeta() *ItemMeta {
	return l.itemMeta
}

func (l *InvoiceLineItem) SetItemMeta(itemMeta *ItemMeta) {
	l.itemMeta = itemMeta
}
