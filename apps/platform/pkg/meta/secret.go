package meta

import (
	"errors"
	"fmt"
	"time"

	"github.com/humandad/yaml"
)

type Secret struct {
	ID        string     `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey string     `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name      string     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace string     `yaml:"-" uesio:"-"`
	Store     string     `yaml:"store,omitempty" uesio:"uesio/studio.store"`
	ManagedBy string     `yaml:"managedBy" uesio:"uesio/studio.managedby"`
	Workspace *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public    bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

func NewSecret(key string) (*Secret, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for ConfigValue: " + key)
	}
	return &Secret{
		Name:      name,
		Namespace: namespace,
	}, nil
}

func (s *Secret) GetCollectionName() string {
	return s.GetBundleGroup().GetName()
}

func (s *Secret) GetCollection() CollectionableGroup {
	var sc SecretCollection
	return &sc
}

func (s *Secret) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, s.Name)
}

func (s *Secret) GetBundleGroup() BundleableGroup {
	var sc SecretCollection
	return &sc
}

func (s *Secret) GetKey() string {
	return fmt.Sprintf("%s.%s", s.Namespace, s.Name)
}

func (s *Secret) GetPath() string {
	return s.Name + ".yaml"
}

func (s *Secret) GetPermChecker() *PermissionSet {
	return nil
}

func (s *Secret) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *Secret) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *Secret) GetNamespace() string {
	return s.Namespace
}

func (s *Secret) SetNamespace(namespace string) {
	s.Namespace = namespace
}

func (s *Secret) SetModified(mod time.Time) {
	s.UpdatedAt = mod.UnixMilli()
}

func (s *Secret) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

func (s *Secret) Len() int {
	return StandardItemLen(s)
}

func (s *Secret) GetItemMeta() *ItemMeta {
	return s.itemMeta
}

func (s *Secret) SetItemMeta(itemMeta *ItemMeta) {
	s.itemMeta = itemMeta
}

func (s *Secret) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, s.Name)
	if err != nil {
		return err
	}
	return node.Decode(s)
}

func (s *Secret) IsPublic() bool {
	return s.Public
}
