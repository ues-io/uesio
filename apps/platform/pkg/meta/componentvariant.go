package meta

import (
	"fmt"
	"path/filepath"

	"github.com/humandad/yaml"
)

// ComponentVariant struct
type ComponentVariant struct {
	ID         string     `yaml:"-" uesio:"uesio.id"`
	Namespace  string     `yaml:"-" uesio:"-"`
	Workspace  *Workspace `yaml:"-" uesio:"studio.workspace"`
	Name       string     `yaml:"name" uesio:"studio.name"`
	Component  string     `yaml:"component" uesio:"studio.component"`
	Extends    string     `yaml:"extends" uesio:"studio.extends"`
	Label      string     `yaml:"label" uesio:"studio.label"`
	Definition yaml.Node  `yaml:"definition" uesio:"studio.definition"`
	itemMeta   *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy  *User      `yaml:"-" uesio:"uesio.createdby"`
	Owner      *User      `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy  *User      `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt  int64      `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt  int64      `yaml:"-" uesio:"uesio.createdat"`
}

func (c *ComponentVariant) GetBundleGroup() BundleableGroup {
	var cvc ComponentVariantCollection
	return &cvc
}

func (c *ComponentVariant) GetPermChecker() *PermissionSet {
	return nil
}

func (c *ComponentVariant) GetKey() string {
	return c.Component + "." + c.Namespace + "." + c.Name
}

func (c *ComponentVariant) GetPath() string {
	return filepath.Join(c.Component, c.Namespace+"."+c.Name) + ".yaml"
}

func (c *ComponentVariant) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s_%s", workspace, c.Component, c.Name)
}

func (c *ComponentVariant) SetNamespace(namespace string) {
	c.Namespace = namespace
}

func (c *ComponentVariant) GetNamespace() string {
	return c.Namespace
}

func (c *ComponentVariant) SetWorkspace(workspace string) {
	c.Workspace = &Workspace{
		ID: workspace,
	}
}

// GetCollectionName function
func (c *ComponentVariant) GetCollectionName() string {
	return c.GetCollection().GetName()
}

// GetCollection function
func (c *ComponentVariant) GetCollection() CollectionableGroup {
	var sc ComponentVariantCollection
	return &sc
}

// SetField function
func (v *ComponentVariant) SetField(fieldName string, value interface{}) error {
	if fieldName == "studio.definition" {
		var definition yaml.Node
		err := yaml.Unmarshal([]byte(value.(string)), &definition)
		if err != nil {
			return err
		}
		if len(definition.Content) > 0 {
			v.Definition = *definition.Content[0]
		}
		return nil
	}
	return StandardFieldSet(v, fieldName, value)
}

// GetField function
func (v *ComponentVariant) GetField(fieldName string) (interface{}, error) {
	if fieldName == "studio.definition" {
		bytes, err := yaml.Marshal(&v.Definition)
		if err != nil {
			return nil, err
		}
		return string(bytes), nil
	}
	return StandardFieldGet(v, fieldName)
}

// Loop function
func (c *ComponentVariant) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

// Len function
func (c *ComponentVariant) Len() int {
	return StandardItemLen(c)
}

// GetItemMeta function
func (c *ComponentVariant) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

// SetItemMeta function
func (c *ComponentVariant) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}

func (cv *ComponentVariant) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, cv.Name)
	if err != nil {
		return err
	}
	return node.Decode(cv)
}

// IsPublic function
func (c *ComponentVariant) IsPublic() bool {
	return true
}
