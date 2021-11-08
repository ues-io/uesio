package meta

import (
	"errors"

	"github.com/humandad/yaml"
)

// Secret struct
type Secret struct {
	ID        string     `yaml:"-" uesio:"uesio.id"`
	Name      string     `yaml:"name" uesio:"studio.name"`
	Namespace string     `yaml:"-" uesio:"-"`
	Store     string     `yaml:"store,omitempty" uesio:"studio.store"`
	ManagedBy string     `yaml:"managedBy" uesio:"studio.managedby"`
	Workspace *Workspace `yaml:"-" uesio:"studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy *User      `yaml:"-" uesio:"uesio.createdby"`
	Owner     *User      `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy *User      `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt int64      `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt int64      `yaml:"-" uesio:"uesio.createdat"`
}

// NewSecret function
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

// GetCollectionName function
func (s *Secret) GetCollectionName() string {
	return s.GetBundleGroup().GetName()
}

// GetCollection function
func (s *Secret) GetCollection() CollectionableGroup {
	var sc SecretCollection
	return &sc
}

// GetConditions function
func (s *Secret) GetConditions() map[string]string {
	return map[string]string{
		"studio.name": s.Name,
	}
}

// GetBundleGroup function
func (s *Secret) GetBundleGroup() BundleableGroup {
	var sc SecretCollection
	return &sc
}

// GetKey function
func (s *Secret) GetKey() string {
	return s.Namespace + "." + s.Name
}

// GetPath function
func (s *Secret) GetPath() string {
	return s.GetKey() + ".yaml"
}

// GetPermChecker function
func (s *Secret) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (s *Secret) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

// GetField function
func (s *Secret) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

// GetNamespace function
func (s *Secret) GetNamespace() string {
	return s.Namespace
}

// SetNamespace function
func (s *Secret) SetNamespace(namespace string) {
	s.Namespace = namespace
}

// SetWorkspace function
func (s *Secret) SetWorkspace(workspace string) {
	s.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (s *Secret) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

// Len function
func (s *Secret) Len() int {
	return StandardItemLen(s)
}

// GetItemMeta function
func (s *Secret) GetItemMeta() *ItemMeta {
	return s.itemMeta
}

// SetItemMeta function
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
