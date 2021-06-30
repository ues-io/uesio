package meta

// SecretStoreValue struct
type SecretStoreValue struct {
	ID        string    `uesio:"uesio.id"`
	Key       string    `uesio:"uesio.key"`
	Value     string    `uesio:"uesio.value"`
	itemMeta  *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy *User     `uesio:"uesio.createdby"`
	UpdatedBy *User     `uesio:"uesio.updatedby"`
	UpdatedAt float64   `uesio:"uesio.updatedat"`
	CreatedAt float64   `uesio:"uesio.createdat"`
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

// GetItemMeta function
func (s *SecretStoreValue) GetItemMeta() *ItemMeta {
	return s.itemMeta
}

// SetItemMeta function
func (s *SecretStoreValue) SetItemMeta(itemMeta *ItemMeta) {
	s.itemMeta = itemMeta
}
