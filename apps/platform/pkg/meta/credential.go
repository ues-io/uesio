package meta

import (
	"errors"
	"fmt"

	"github.com/humandad/yaml"
)

// NewCredential function
func NewCredential(key string) (*Credential, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Credential: " + key)
	}
	return &Credential{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type CredentialEntry struct {
	Type  string `yaml:"type" uesio:"uesio/studio.type"`
	Value string `yaml:"value" uesio:"uesio/studio.value"`
}

// Credential struct
type Credential struct {
	ID        string                     `yaml:"-" uesio:"uesio/core.id"`
	Name      string                     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace string                     `yaml:"-" uesio:"-"`
	Entries   map[string]CredentialEntry `yaml:"entries" uesio:"uesio/studio.entries"`
	Workspace *Workspace                 `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta  *ItemMeta                  `yaml:"-" uesio:"-"`
	CreatedBy *User                      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User                      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User                      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64                      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64                      `yaml:"-" uesio:"uesio/core.createdat"`
	Public    bool                       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

// GetCollectionName function
func (c *Credential) GetCollectionName() string {
	return c.GetBundleGroup().GetName()
}

// GetCollection function
func (c *Credential) GetCollection() CollectionableGroup {
	var cc CredentialCollection
	return &cc
}

func (c *Credential) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, c.Name)
}

// GetBundleGroup function
func (c *Credential) GetBundleGroup() BundleableGroup {
	var cc CredentialCollection
	return &cc
}

// GetKey function
func (c *Credential) GetKey() string {
	return fmt.Sprintf("%s.%s", c.Namespace, c.Name)
}

// GetPath function
func (c *Credential) GetPath() string {
	return c.Name + ".yaml"
}

// GetPermChecker function
func (c *Credential) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (c *Credential) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

// GetField function
func (c *Credential) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

// GetNamespace function
func (c *Credential) GetNamespace() string {
	return c.Namespace
}

// SetNamespace function
func (c *Credential) SetNamespace(namespace string) {
	c.Namespace = namespace
}

// SetWorkspace function
func (c *Credential) SetWorkspace(workspace string) {
	c.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (c *Credential) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

// Len function
func (c *Credential) Len() int {
	return StandardItemLen(c)
}

// GetItemMeta function
func (c *Credential) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

// SetItemMeta function
func (c *Credential) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}

func (c *Credential) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, c.Name)
	if err != nil {
		return err
	}
	return node.Decode(c)
}
func (c *Credential) IsPublic() bool {
	return c.Public
}
