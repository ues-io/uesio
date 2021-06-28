package meta

// ConfigStoreValue struct
type ConfigStoreValue struct {
	ID        string    `uesio:"uesio.id"`
	Key       string    `uesio:"uesio.key"`
	Value     string    `uesio:"uesio.value"`
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `uesio:"uesio.createdby"`
	UpdatedBy *User     `uesio:"uesio.updatedby"`
	UpdatedAt int64     `uesio:"uesio.updatedat"`
	CreatedAt int64     `uesio:"uesio.createdat"`
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

// GetItemMeta function
func (c *ConfigStoreValue) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

// SetItemMeta function
func (c *ConfigStoreValue) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}
