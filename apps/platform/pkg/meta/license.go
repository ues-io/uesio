package meta

type License struct {
	ID          string    `json:"uesio/core.id"`
	UniqueKey   string    `json:"uesio/core.uniquekey"`
	Active      bool      `json:"uesio/studio.active"`
	App         *App      `json:"uesio/studio.app"`
	AppLicensed *App      `json:"uesio/studio.applicensed"`
	itemMeta    *ItemMeta `json:"-"`
	CreatedBy   *User     `json:"uesio/core.createdby"`
	Owner       *User     `json:"uesio/core.owner"`
	UpdatedBy   *User     `json:"uesio/core.updatedby"`
	UpdatedAt   int64     `json:"uesio/core.updatedat"`
	CreatedAt   int64     `json:"uesio/core.createdat"`
}

func (l *License) GetCollectionName() string {
	return l.GetCollection().GetName()
}

func (l *License) GetCollection() CollectionableGroup {
	return &LicenseCollection{}
}

func (l *License) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(l, fieldName, value)
}

func (l *License) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(l, fieldName)
}

func (l *License) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(l, iter)
}

func (l *License) Len() int {
	return StandardItemLen(l)
}

func (l *License) GetItemMeta() *ItemMeta {
	return l.itemMeta
}

func (l *License) SetItemMeta(itemMeta *ItemMeta) {
	l.itemMeta = itemMeta
}
