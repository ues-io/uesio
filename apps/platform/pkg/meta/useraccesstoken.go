package meta

import (
	"errors"
	"fmt"
)

func NewUserAccessToken(key string) (*UserAccessToken, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for User Access Token: " + key)
	}
	return &UserAccessToken{
		Name: name,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}, nil
}

type UserAccessToken struct {
	Name       string            `yaml:"name" json:"uesio/studio.name"`
	Type       string            `yaml:"type" json:"uesio/studio.type"`
	Collection string            `yaml:"collection" json:"uesio/studio.collection"`
	Conditions []*TokenCondition `yaml:"conditions"  json:"uesio/studio.conditions"`
	Token      string            `yaml:"token"  json:"uesio/studio.token"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

func (uat *UserAccessToken) GetCollectionName() string {
	return uat.GetBundleGroup().GetName()
}

func (uat *UserAccessToken) GetCollection() CollectionableGroup {
	return &UserAccessTokenCollection{}
}

func (uat *UserAccessToken) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, uat.Name)
}

func (uat *UserAccessToken) GetBundleGroup() BundleableGroup {
	return &UserAccessTokenCollection{}
}

func (uat *UserAccessToken) GetKey() string {
	return fmt.Sprintf("%s.%s", uat.Namespace, uat.Name)
}

func (uat *UserAccessToken) GetPath() string {
	return uat.Name + ".yaml"
}

func (uat *UserAccessToken) GetPermChecker() *PermissionSet {
	return nil
}

func (uat *UserAccessToken) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(uat, fieldName, value)
}

func (uat *UserAccessToken) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(uat, fieldName)
}

func (uat *UserAccessToken) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(uat, iter)
}

func (uat *UserAccessToken) Len() int {
	return StandardItemLen(uat)
}

func (uat *UserAccessToken) IsPublic() bool {
	return true
}
