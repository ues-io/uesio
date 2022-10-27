package meta

import (
	"errors"
	"fmt"
	"time"
)

func NewUserAccessToken(key string) (*UserAccessToken, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for User Access Token: " + key)
	}
	return &UserAccessToken{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type UserAccessToken struct {
	ID         string            `yaml:"-" json:"uesio/core.id"`
	UniqueKey  string            `yaml:"-" json:"uesio/core.uniquekey"`
	Name       string            `yaml:"name" json:"uesio/studio.name"`
	Namespace  string            `yaml:"-" json:"-"`
	Type       string            `yaml:"type" json:"uesio/studio.type"`
	Collection string            `yaml:"collection" json:"uesio/studio.collection"`
	Conditions []*TokenCondition `yaml:"conditions"  json:"uesio/studio.conditions"`
	Token      string            `yaml:"token"  json:"uesio/studio.token"`
	Workspace  *Workspace        `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta   *ItemMeta         `yaml:"-" json:"-"`
	CreatedBy  *User             `yaml:"-" json:"uesio/core.createdby"`
	Owner      *User             `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy  *User             `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt  int64             `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt  int64             `yaml:"-" json:"uesio/core.createdat"`
}

func (uat *UserAccessToken) GetCollectionName() string {
	return uat.GetBundleGroup().GetName()
}

func (uat *UserAccessToken) GetCollection() CollectionableGroup {
	var uatc UserAccessTokenCollection
	return &uatc
}

func (uat *UserAccessToken) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, uat.Name)
}

func (uat *UserAccessToken) GetBundleGroup() BundleableGroup {
	var uatc UserAccessTokenCollection
	return &uatc
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

func (uat *UserAccessToken) GetNamespace() string {
	return uat.Namespace
}

func (uat *UserAccessToken) SetNamespace(namespace string) {
	uat.Namespace = namespace
}

func (uat *UserAccessToken) SetModified(mod time.Time) {
	uat.UpdatedAt = mod.UnixMilli()
}

func (uat *UserAccessToken) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(uat, iter)
}

func (uat *UserAccessToken) Len() int {
	return StandardItemLen(uat)
}

func (uat *UserAccessToken) GetItemMeta() *ItemMeta {
	return uat.itemMeta
}

func (uat *UserAccessToken) SetItemMeta(itemMeta *ItemMeta) {
	uat.itemMeta = itemMeta
}

func (uat *UserAccessToken) IsPublic() bool {
	return true
}
