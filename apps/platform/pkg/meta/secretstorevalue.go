package meta

// SecretStoreValue struct
type SecretStoreValue struct {
	ID        string    `uesio:"uesio.id"`
	Key       string    `uesio:"uesio.key"`
	Value     string    `uesio:"uesio.value"`
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `yaml:"-" uesio:"uesio.createdby"`
	Owner     *User     `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy *User     `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt int64     `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt int64     `yaml:"-" uesio:"uesio.createdat"`
}

// GetCollectionName function
func (s *SecretStoreValue) GetCollectionName() string {
	return s.GetCollection().GetName()
}

// GetCollection function
func (s *SecretStoreValue) GetCollection() CollectionableGroup {
	var sc SecretStoreValueCollection
	return &sc
}

// SetField function
func (s *SecretStoreValue) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

// GetField function
func (s *SecretStoreValue) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

// Loop function
func (s *SecretStoreValue) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

// Len function
func (s *SecretStoreValue) Len() int {
	return StandardItemLen(s)
}

// GetItemMeta function
func (s *SecretStoreValue) GetItemMeta() *ItemMeta {
	return s.itemMeta
}

// SetItemMeta function
func (s *SecretStoreValue) SetItemMeta(itemMeta *ItemMeta) {
	s.itemMeta = itemMeta
}
