package meta

type LoginMethod struct {
	FederationID string `json:"uesio/core.federation_id"`
	AuthSource   string `json:"uesio/core.auth_source"`
	User         *User  `json:"uesio/core.user"`
	BuiltIn
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
