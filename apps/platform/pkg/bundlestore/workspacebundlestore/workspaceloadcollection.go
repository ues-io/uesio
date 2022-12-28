package workspacebundlestore

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type WorkspaceLoadCollection struct {
	Collection meta.BundleableGroup
	Namespace  string
}

func (c *WorkspaceLoadCollection) NewItem() meta.Item {
	item := c.Collection.NewItem().(meta.BundleableItem)
	item.SetNamespace(c.Namespace)
	return item
}

func (c *WorkspaceLoadCollection) AddItem(item meta.Item) {
	c.Collection.AddItem(item)
}

func (c *WorkspaceLoadCollection) Loop(iter meta.GroupIterator) error {
	return c.Collection.Loop(iter)
}

func (c *WorkspaceLoadCollection) Len() int {
	return c.Collection.Len()
}

func (c *WorkspaceLoadCollection) GetFields() []string {
	return c.Collection.GetFields()
}

func (c *WorkspaceLoadCollection) GetName() string {
	return c.Collection.GetName()
}
