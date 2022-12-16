package meta

import (
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

type Component struct {
	ID        string     `yaml:"-" json:"uesio/core.id"`
	UniqueKey string     `yaml:"-" json:"uesio/core.uniquekey"`
	Name      string     `yaml:"name" json:"uesio/studio.name"`
	Namespace string     `yaml:"-" json:"-"`
	Type      string     `yaml:"type" json:"uesio/studio.type"`
	Workspace *Workspace `yaml:"-" json:"uesio/studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" json:"-"`
	CreatedBy *User      `yaml:"-" json:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" json:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" json:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" json:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" json:"uesio/core.createdat"`
	Public    bool       `yaml:"public,omitempty" json:"uesio/studio.public"`
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

func (c *Component) GetNamespace() string {
	return c.Namespace
}

func (c *Component) SetNamespace(namespace string) {
	c.Namespace = namespace
}

func (c *Component) SetModified(mod time.Time) {
	c.UpdatedAt = mod.UnixMilli()
}

func (c *Component) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(c, iter)
}

func (c *Component) Len() int {
	return StandardItemLen(c)
}

func (c *Component) GetItemMeta() *ItemMeta {
	return c.itemMeta
}

func (c *Component) SetItemMeta(itemMeta *ItemMeta) {
	c.itemMeta = itemMeta
}

func (c *Component) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, c.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ComponentWrapper)(c))
}

func (c *Component) IsPublic() bool {
	return c.Public
}
