package meta

type LoginMethod struct {
	BuiltIn             `yaml:",inline"`
	FederationID        string `json:"uesio/core.federation_id"`
	AuthSource          string `json:"uesio/core.auth_source"`
	User                *User  `json:"uesio/core.user"`
	Hash                string `json:"uesio/core.hash"`
	VerificationCode    string `json:"uesio/core.verification_code"`
	VerificationExpires int64  `json:"uesio/core.verification_expires"`
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
