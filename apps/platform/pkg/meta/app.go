package meta

type App struct {
	ID          string    `json:"uesio/core.id"`
	UniqueKey   string    `json:"uesio/core.uniquekey"`
	FullName    string    `json:"uesio/studio.fullname"`
	Name        string    `json:"uesio/studio.name"`
	User        *User     `json:"uesio/studio.user"`
	Description string    `json:"uesio/studio.description"`
	Color       string    `json:"uesio/studio.color"`
	Icon        string    `json:"uesio/studio.icon"`
	Public      bool      `json:"uesio/studio.public"`
	itemMeta    *ItemMeta `json:"-"`
	CreatedBy   *User     `json:"uesio/core.createdby"`
	Owner       *User     `json:"uesio/core.owner"`
	UpdatedBy   *User     `json:"uesio/core.updatedby"`
	UpdatedAt   int64     `json:"uesio/core.updatedat"`
	CreatedAt   int64     `json:"uesio/core.createdat"`
}

func (a *App) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *App) GetCollection() CollectionableGroup {
	var ac AppCollection
	return &ac
}

func (a *App) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *App) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *App) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

func (a *App) Len() int {
	return StandardItemLen(a)
}

func (a *App) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

func (a *App) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
