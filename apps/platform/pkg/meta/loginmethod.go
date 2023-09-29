package meta

type LoginMethod struct {
	BuiltIn      `yaml:",inline"`
	FederationID string `json:"uesio/core.federation_id"`
	AuthSource   string `json:"uesio/core.auth_source"`
	Hash         string `json:"uesio/core.hash"`
	User         *User  `json:"uesio/core.user"`
	Code         string `json:"uesio/core.code"`
	Verified     bool   `json:"uesio/core.verified"`
}

func (lm *LoginMethod) GetCollectionName() string {
	return LOGINMETHOD_COLLECTION_NAME
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
