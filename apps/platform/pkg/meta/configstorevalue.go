package meta

type ConfigStoreValue struct {
	ID        string    `json:"uesio/core.id"`
	UniqueKey string    `json:"uesio/core.uniquekey"`
	Key       string    `json:"uesio/core.key"`
	Value     string    `json:"uesio/core.value"`
	itemMeta  *ItemMeta `json:"-"`
	CreatedBy *User     `json:"uesio/core.createdby"`
	Owner     *User     `json:"uesio/core.owner"`
	UpdatedBy *User     `json:"uesio/core.updatedby"`
	UpdatedAt int64     `json:"uesio/core.updatedat"`
	CreatedAt int64     `json:"uesio/core.createdat"`
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
