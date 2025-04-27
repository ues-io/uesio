package meta

import "fmt"

func NewUserAccessToken(key string) (*UserAccessToken, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for user access token: %s", key)
	}
	return NewBaseUserAccessToken(namespace, name), nil
}

func NewBaseUserAccessToken(namespace, name string) *UserAccessToken {
	return &UserAccessToken{BundleableBase: NewBase(namespace, name)}
}

type UserAccessToken struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Type           string            `yaml:"type" json:"uesio/studio.type"`
	Collection     string            `yaml:"collection" json:"uesio/studio.collection"`
	Conditions     []*TokenCondition `yaml:"conditions"  json:"uesio/studio.conditions"`
	Token          string            `yaml:"token"  json:"uesio/studio.token"`
	Reason         string            `yaml:"reason" json:"uesio/studio.reason"`
}

func (uat *UserAccessToken) GetCollection() CollectionableGroup {
	return &UserAccessTokenCollection{}
}

func (uat *UserAccessToken) GetCollectionName() string {
	return USERACCESSTOKEN_COLLECTION_NAME
}

func (uat *UserAccessToken) GetBundleFolderName() string {
	return USERACCESSTOKEN_FOLDER_NAME
}

func (uat *UserAccessToken) SetField(fieldName string, value any) error {
	return StandardFieldSet(uat, fieldName, value)
}

func (uat *UserAccessToken) GetField(fieldName string) (any, error) {
	return StandardFieldGet(uat, fieldName)
}

func (uat *UserAccessToken) Loop(iter func(string, any) error) error {
	return StandardItemLoop(uat, iter)
}

func (uat *UserAccessToken) Len() int {
	return StandardItemLen(uat)
}
