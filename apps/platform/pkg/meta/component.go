package meta

import (
	"fmt"

	"gopkg.in/yaml.v3"
)

type Component struct {
	Name string `yaml:"name" json:"uesio/studio.name"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type ComponentWrapper Component

func (c *Component) GetCollectionName() string {
	return c.GetBundleGroup().GetName()
}

func (c *Component) GetCollection() CollectionableGroup {
	return &ComponentCollection{}
}

func (c *Component) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, c.Name)
}

func (c *Component) GetBundleGroup() BundleableGroup {
	return &ComponentCollection{}
}

func (c *Component) GetKey() string {
	return fmt.Sprintf("%s.%s", c.Namespace, c.Name)
}

func (c *Component) GetPath() string {
	return c.Name + ".yaml"
}

func (c *Component) GetPermChecker() *PermissionSet {
	return nil
}

func (c *Component) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(c, fieldName, value)
}

func (c *Component) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(c, fieldName)
}

func (c *Component) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

func (c *Component) Len() int {
	return StandardItemLen(c)
}

func (c *Component) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, c.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ComponentWrapper)(c))
}
