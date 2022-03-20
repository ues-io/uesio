package meta

import (
	"errors"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/humandad/yaml"
)

func NewComponentVariant(key string) (*ComponentVariant, error) {
	keyArray := strings.Split(key, ":")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Variant Key: " + key)
	}
	namespace, name, err := ParseKey(keyArray[1])
	if err != nil {
		return nil, errors.New("Invalid Variant Key: " + key)
	}
	return &ComponentVariant{
		Component: keyArray[0],
		Name:      name,
		Namespace: namespace,
	}, nil
}

// ComponentVariant struct
type ComponentVariant struct {
	ID         string     `yaml:"-" uesio:"uesio/core.id"`
	Namespace  string     `yaml:"-" uesio:"-"`
	Workspace  *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	Name       string     `yaml:"name" uesio:"uesio/studio.name"`
	Component  string     `yaml:"component" uesio:"uesio/studio.component"`
	Extends    string     `yaml:"extends" uesio:"uesio/studio.extends"`
	Label      string     `yaml:"label" uesio:"uesio/studio.label"`
	Definition yaml.Node  `yaml:"definition" uesio:"uesio/studio.definition"`
	itemMeta   *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy  *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner      *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy  *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt  int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt  int64      `yaml:"-" uesio:"uesio/core.createdat"`
}

func (c *ComponentVariant) GetBundleGroup() BundleableGroup {
	var cvc ComponentVariantCollection
	return &cvc
}

func (c *ComponentVariant) GetPermChecker() *PermissionSet {
	return nil
}

func (c *ComponentVariant) GetKey() string {
	return fmt.Sprintf("%s:%s.%s", c.Component, c.Namespace, c.Name)
}

func (c *ComponentVariant) GetPath() string {
	componentNamespace, componentName, _ := ParseKey(c.Component)
	nsUser, appName, _ := ParseNamespace(componentNamespace)
	return filepath.Join(nsUser, appName, componentName, c.Name) + ".yaml"
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
	if fieldName == "uesio/studio.definition" {
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
	if fieldName == "uesio/studio.definition" {
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
