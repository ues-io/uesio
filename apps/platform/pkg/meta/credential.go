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
	Type  string `yaml:"type" uesio:"studio.type"`
	Value string `yaml:"value" uesio:"studio.value"`
}

// Credential struct
type Credential struct {
	ID        string                     `yaml:"-" uesio:"uesio.id"`
	Name      string                     `yaml:"name" uesio:"studio.name"`
	Namespace string                     `yaml:"-" uesio:"-"`
	Entries   map[string]CredentialEntry `yaml:"entries" uesio:"studio.entries"`
	TypeRef   string                     `yaml:"type" uesio:"studio.type"`
	Workspace *Workspace                 `yaml:"-" uesio:"studio.workspace"`
	itemMeta  *ItemMeta                  `yaml:"-" uesio:"-"`
	CreatedBy *User                      `yaml:"-" uesio:"uesio.createdby"`
	Owner     *User                      `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy *User                      `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt int64                      `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt int64                      `yaml:"-" uesio:"uesio.createdat"`
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
	return c.Namespace + "." + c.Name
}

// GetPath function
func (c *Credential) GetPath() string {
	return c.GetKey() + ".yaml"
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
