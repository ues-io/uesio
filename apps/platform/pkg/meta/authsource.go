package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/humandad/yaml"
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
	ID          string     `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey   string     `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name        string     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace   string     `yaml:"-" uesio:"-"`
	Type        string     `yaml:"type" uesio:"uesio/studio.type"`
	Credentials string     `yaml:"credentials" uesio:"uesio/studio.credentials"`
	Workspace   *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta    *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy   *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner       *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy   *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt   int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt   int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public      bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

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
	return node.Decode(as)
}

func (as *AuthSource) IsPublic() bool {
	return as.Public
}
