package meta

type LoginMethod struct {
	ID             string    `uesio:"uesio/uesio.id"`
	FederationID   string    `uesio:"uesio/uesio.federation_id"`
	FederationType string    `uesio:"uesio/uesio.federation_type"`
	User           *User     `uesio:"uesio/uesio.user"`
	itemMeta       *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy      *User     `yaml:"-" uesio:"uesio/uesio.createdby"`
	Owner          *User     `yaml:"-" uesio:"uesio/uesio.owner"`
	UpdatedBy      *User     `yaml:"-" uesio:"uesio/uesio.updatedby"`
	UpdatedAt      int64     `yaml:"-" uesio:"uesio/uesio.updatedat"`
	CreatedAt      int64     `yaml:"-" uesio:"uesio/uesio.createdat"`
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
