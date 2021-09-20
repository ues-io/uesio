package meta

// App struct
type App struct {
	ID          string    `uesio:"uesio.id"`
	Name        string    `uesio:"uesio.name"`
	Description string    `uesio:"uesio.description"`
	Color       string    `uesio:"uesio.color"`
	itemMeta    *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy   *User     `yaml:"-" uesio:"uesio.createdby"`
	Owner       *User     `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy   *User     `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt   int64     `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt   int64     `yaml:"-" uesio:"uesio.createdat"`
}

// GetCollectionName function
func (a *App) GetCollectionName() string {
	return a.GetCollection().GetName()
}

// GetCollection function
func (a *App) GetCollection() CollectionableGroup {
	var ac AppCollection
	return &ac
}

// SetField function
func (a *App) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

// GetField function
func (a *App) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

// Loop function
func (a *App) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(a, iter)
}

// Len function
func (a *App) Len() int {
	return StandardItemLen(a)
}

// GetItemMeta function
func (a *App) GetItemMeta() *ItemMeta {
	return a.itemMeta
}

// SetItemMeta function
func (a *App) SetItemMeta(itemMeta *ItemMeta) {
	a.itemMeta = itemMeta
}
