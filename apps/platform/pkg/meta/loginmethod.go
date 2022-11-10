package meta

type LoginMethod struct {
	ID           string    `json:"uesio/core.id"`
	UniqueKey    string    `json:"uesio/core.uniquekey"`
	FederationID string    `json:"uesio/core.federation_id"`
	AuthSource   string    `json:"uesio/core.auth_source"`
	User         *User     `json:"uesio/core.user"`
	itemMeta     *ItemMeta `json:"-"`
	CreatedBy    *User     `json:"uesio/core.createdby"`
	Owner        *User     `json:"uesio/core.owner"`
	UpdatedBy    *User     `json:"uesio/core.updatedby"`
	UpdatedAt    int64     `json:"uesio/core.updatedat"`
	CreatedAt    int64     `json:"uesio/core.createdat"`
}

func (lm *LoginMethod) GetCollectionName() string {
	return lm.GetCollection().GetName()
}

func (lm *LoginMethod) GetCollection() CollectionableGroup {
	return &LoginMethodCollection{}
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
