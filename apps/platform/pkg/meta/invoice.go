package meta

type Invoice struct {
	ID        string    `json:"uesio/core.id"`
	UniqueKey string    `json:"uesio/core.uniquekey"`
	App       *App      `json:"uesio/studio.app"`
	Date      string    `json:"uesio/studio.date"`
	Total     float64   `json:"uesio/studio.total"`
	itemMeta  *ItemMeta `json:"-"`
	CreatedBy *User     `json:"uesio/core.createdby"`
	Owner     *User     `json:"uesio/core.owner"`
	UpdatedBy *User     `json:"uesio/core.updatedby"`
	UpdatedAt int64     `json:"uesio/core.updatedat"`
	CreatedAt int64     `json:"uesio/core.createdat"`
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

func (l *Invoice) GetItemMeta() *ItemMeta {
	return l.itemMeta
}

func (l *Invoice) SetItemMeta(itemMeta *ItemMeta) {
	l.itemMeta = itemMeta
}
