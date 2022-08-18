package meta

type ConfigStoreValue struct {
	ID        string    `uesio:"uesio/core.id"`
	UniqueKey string    `yaml:"-" uesio:"uesio/core.uniquekey"`
	Key       string    `uesio:"uesio/core.key"`
	Value     string    `uesio:"uesio/core.value"`
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

func (c *ConfigStoreValue) GetCollectionName() string {
	return c.GetCollection().GetName()
}

func (c *ConfigStoreValue) GetCollection() CollectionableGroup {
	var sc ConfigStoreValueCollection
	return &sc
}

func (c *ConfigStoreValue) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

func (c *ConfigStoreValue) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

func (c *ConfigStoreValue) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

func (c *ConfigStoreValue) Len() int {
	return StandardItemLen(c)
}

func (c *ConfigStoreValue) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

func (c *ConfigStoreValue) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}
