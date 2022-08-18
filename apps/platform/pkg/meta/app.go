package meta

type App struct {
	ID          string    `uesio:"uesio/core.id"`
	UniqueKey   string    `yaml:"-" uesio:"uesio/core.uniquekey"`
	FullName    string    `yaml:"-" uesio:"uesio/studio.fullname"`
	Name        string    `uesio:"uesio/studio.name"`
	User        *User     `yaml:"-" uesio:"uesio/studio.user"`
	Description string    `uesio:"uesio/studio.description"`
	Color       string    `uesio:"uesio/studio.color"`
	Icon        string    `uesio:"uesio/studio.icon"`
	itemMeta    *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy   *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner       *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy   *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt   int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt   int64     `yaml:"-" uesio:"uesio/core.createdat"`
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
