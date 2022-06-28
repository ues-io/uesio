package meta

type LoginMethod struct {
	ID           string    `uesio:"uesio/core.id"`
	UniqueKey    string    `yaml:"-" uesio:"uesio/core.uniquekey"`
	FederationID string    `uesio:"uesio/core.federation_id"`
	AuthSource   string    `uesio:"uesio/core.auth_source"`
	User         *User     `uesio:"uesio/core.user"`
	itemMeta     *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy    *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner        *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy    *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt    int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt    int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

func (lm *LoginMethod) GetCollectionName() string {
	return lm.GetCollection().GetName()
}

func (lm *LoginMethod) GetCollection() CollectionableGroup {
	var lmc LoginMethodCollection
	return &lmc
}

func (lm *LoginMethod) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(lm, fieldName, value)
}

func (lm *LoginMethod) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(lm, fieldName)
}

func (lm *LoginMethod) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(lm, iter)
}

func (lm *LoginMethod) Len() int {
	return StandardItemLen(lm)
}

func (lm *LoginMethod) GetItemMeta() *ItemMeta {
	return lm.itemMeta
}

func (lm *LoginMethod) SetItemMeta(itemMeta *ItemMeta) {
	lm.itemMeta = itemMeta
}
