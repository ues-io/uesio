package meta

type SecretStoreValue struct {
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

func (s *SecretStoreValue) GetCollectionName() string {
	return s.GetCollection().GetName()
}

func (s *SecretStoreValue) GetCollection() CollectionableGroup {
	var sc SecretStoreValueCollection
	return &sc
}

func (s *SecretStoreValue) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *SecretStoreValue) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *SecretStoreValue) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

func (s *SecretStoreValue) Len() int {
	return StandardItemLen(s)
}

func (s *SecretStoreValue) GetItemMeta() *ItemMeta {
	return s.itemMeta
}

func (s *SecretStoreValue) SetItemMeta(itemMeta *ItemMeta) {
	s.itemMeta = itemMeta
}
