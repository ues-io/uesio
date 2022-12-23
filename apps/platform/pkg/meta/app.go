package meta

type App struct {
	FullName    string `json:"uesio/studio.fullname"`
	Name        string `json:"uesio/studio.name"`
	User        *User  `json:"uesio/studio.user"`
	Description string `json:"uesio/studio.description"`
	Color       string `json:"uesio/studio.color"`
	Icon        string `json:"uesio/studio.icon"`
	Public      bool   `json:"uesio/studio.public"`
	BuiltIn
}

func (a *App) GetCollectionName() string {
	return a.GetCollection().GetName()
}

func (a *App) GetCollection() CollectionableGroup {
	return &AppCollection{}
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
