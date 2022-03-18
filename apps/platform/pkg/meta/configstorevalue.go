package meta

// ConfigStoreValue struct
type ConfigStoreValue struct {
	ID        string    `uesio:"uesio/core.id"`
	Key       string    `uesio:"uesio/core.key"`
	Value     string    `uesio:"uesio/core.value"`
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

// GetCollectionName function
func (c *ConfigStoreValue) GetCollectionName() string {
	return c.GetCollection().GetName()
}

// GetCollection function
func (c *ConfigStoreValue) GetCollection() CollectionableGroup {
	var sc ConfigStoreValueCollection
	return &sc
}

// SetField function
func (c *ConfigStoreValue) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

// GetField function
func (c *ConfigStoreValue) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

// Loop function
func (c *ConfigStoreValue) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

// Len function
func (c *ConfigStoreValue) Len() int {
	return StandardItemLen(c)
}

// GetItemMeta function
func (c *ConfigStoreValue) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

// SetItemMeta function
func (c *ConfigStoreValue) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}
