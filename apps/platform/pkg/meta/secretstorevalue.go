package meta

type SecretStoreValue struct {
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

func (s *SecretStoreValue) GetCollectionName() string {
	return s.GetCollection().GetName()
}

func (s *SecretStoreValue) GetCollection() CollectionableGroup {
	return &SecretStoreValueCollection{}
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
