package meta

type ConfigStoreValue struct {
	BuiltIn `yaml:",inline"`
	Key     string `json:"uesio/core.key"`
	Value   string `json:"uesio/core.value"`
}

func (c *ConfigStoreValue) GetCollection() CollectionableGroup {
	return &ConfigStoreValueCollection{}
}

func (c *ConfigStoreValue) GetCollectionName() string {
	return CONFIGSTOREVALUE_COLLECTION_NAME
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
