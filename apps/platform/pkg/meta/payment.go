package meta

type Payment struct {
	ID              string    `json:"uesio/core.id"`
	UniqueKey       string    `json:"uesio/core.uniquekey"`
	AutoID          string    `json:"uesio/studio.autoid"`
	User            *User     `json:"uesio/studio.user"`
	Date            string    `json:"uesio/studio.date"`
	Total           float64   `json:"uesio/studio.total"`
	CheckoutSession string    `json:"uesio/studio.checkoutsession"`
	itemMeta        *ItemMeta `json:"-"`
	CreatedBy       *User     `json:"uesio/core.createdby"`
	Owner           *User     `json:"uesio/core.owner"`
	UpdatedBy       *User     `json:"uesio/core.updatedby"`
	UpdatedAt       int64     `json:"uesio/core.updatedat"`
	CreatedAt       int64     `json:"uesio/core.createdat"`
}

func (l *Payment) GetCollectionName() string {
	return l.GetCollection().GetName()
}

func (l *Payment) GetCollection() CollectionableGroup {
	return &PaymentCollection{}
}

func (l *Payment) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(l, fieldName, value)
}

func (l *Payment) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(l, fieldName)
}

func (l *Payment) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(l, iter)
}

func (l *Payment) Len() int {
	return StandardItemLen(l)
}

func (l *Payment) GetItemMeta() *ItemMeta {
	return l.itemMeta
}

func (l *Payment) SetItemMeta(itemMeta *ItemMeta) {
	l.itemMeta = itemMeta
}
