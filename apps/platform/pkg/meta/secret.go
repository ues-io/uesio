package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

type Secret struct {
	ID        string     `yaml:"-" json:"uesio/core.id"`
	UniqueKey string     `yaml:"-" json:"uesio/core.uniquekey"`
	Name      string     `yaml:"name" json:"uesio/studio.name"`
	Namespace string     `yaml:"-" json:"-"`
	Store     string     `yaml:"store,omitempty" json:"uesio/studio.store"`
	ManagedBy string     `yaml:"managedBy,omitempty" json:"uesio/studio.managedby"`
	Workspace *Workspace `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" json:"-"`
	CreatedBy *User      `yaml:"-" json:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" json:"uesio/core.createdat"`
	Public    bool       `yaml:"public,omitempty" json:"uesio/studio.public"`
}

type SecretWrapper Secret

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
	return node.Decode((*SecretWrapper)(s))
}

func (s *Secret) IsPublic() bool {
	return s.Public
}
