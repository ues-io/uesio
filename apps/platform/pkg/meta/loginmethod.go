package meta

type LoginMethod struct {
	ID           string    `uesio:"uesio/core.id"`
	FederationID string    `uesio:"uesio/core.federation_id"`
	AuthMethod   string    `uesio:"uesio/core.auth_method"`
	User         *User     `uesio:"uesio/core.user"`
	itemMeta     *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy    *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner        *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy    *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt    int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt    int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

// GetCollectionName function
func (lm *LoginMethod) GetCollectionName() string {
	return lm.GetCollection().GetName()
}

// GetCollection function
func (lm *LoginMethod) GetCollection() CollectionableGroup {
	var lmc LoginMethodCollection
	return &lmc
}

// SetField function
func (lm *LoginMethod) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(lm, fieldName, value)
}

// GetField function
func (lm *LoginMethod) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(lm, fieldName)
}

// Loop function
func (lm *LoginMethod) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(lm, iter)
}

// Len function
func (lm *LoginMethod) Len() int {
	return StandardItemLen(lm)
}

// GetItemMeta function
func (lm *LoginMethod) GetItemMeta() *ItemMeta {
	return lm.itemMeta
}

// SetItemMeta function
func (lm *LoginMethod) SetItemMeta(itemMeta *ItemMeta) {
	lm.itemMeta = itemMeta
}
