package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

func NewAuthSource(key string) (*AuthSource, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for AuthSource: " + key)
	}
	return &AuthSource{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type AuthSource struct {
	ID          string     `yaml:"-" json:"uesio/core.id"`
	UniqueKey   string     `yaml:"-" json:"uesio/core.uniquekey"`
	Name        string     `yaml:"name" json:"uesio/studio.name"`
	Namespace   string     `yaml:"-" json:"-"`
	Type        string     `yaml:"type" json:"uesio/studio.type"`
	Credentials string     `yaml:"credentials" json:"uesio/studio.credentials"`
	Workspace   *Workspace `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta    *ItemMeta  `yaml:"-" json:"-"`
	CreatedBy   *User      `yaml:"-" json:"uesio/core.createdby"`
	Owner       *User      `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy   *User      `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt   int64      `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt   int64      `yaml:"-" json:"uesio/core.createdat"`
	Public      bool       `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type AuthSourceWrapper AuthSource

func (as *AuthSource) GetCollectionName() string {
	return as.GetBundleGroup().GetName()
}

func (as *AuthSource) GetCollection() CollectionableGroup {
	var asc AuthSourceCollection
	return &asc
}

func (as *AuthSource) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, as.Name)
}

func (as *AuthSource) GetBundleGroup() BundleableGroup {
	var asc AuthSourceCollection
	return &asc
}

func (as *AuthSource) GetKey() string {
	return fmt.Sprintf("%s.%s", as.Namespace, as.Name)
}

func (as *AuthSource) GetPath() string {
	return as.Name + ".yaml"
}

func (as *AuthSource) GetPermChecker() *PermissionSet {
	return nil
}

func (as *AuthSource) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(as, fieldName, value)
}

func (as *AuthSource) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(as, fieldName)
}

func (as *AuthSource) GetNamespace() string {
	return as.Namespace
}

func (as *AuthSource) SetNamespace(namespace string) {
	as.Namespace = namespace
}

func (as *AuthSource) SetModified(mod time.Time) {
	as.UpdatedAt = mod.UnixMilli()
}

func (as *AuthSource) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(as, iter)
}

func (as *AuthSource) Len() int {
	return StandardItemLen(as)
}

func (as *AuthSource) GetItemMeta() *ItemMeta {
	return as.itemMeta
}

func (as *AuthSource) SetItemMeta(itemMeta *ItemMeta) {
	as.itemMeta = itemMeta
}

func (as *AuthSource) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, as.Name)
	if err != nil {
		return err
	}
	return node.Decode((*AuthSourceWrapper)(as))
}

func (as *AuthSource) IsPublic() bool {
	return as.Public
}
