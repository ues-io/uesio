package workspacebundlestore

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type WorkspaceLoadCollection struct {
	Collection meta.BundleableGroup
	Namespace  string
}

func (c *WorkspaceLoadCollection) GetItem(index int) loadable.Item {
	return c.Collection.GetItem(index)
}

func (c *WorkspaceLoadCollection) NewItem() loadable.Item {
	item := c.Collection.NewItem().(meta.BundleableItem)
	item.SetNamespace(c.Namespace)
	return item
}

func (c *WorkspaceLoadCollection) Loop(iter loadable.GroupIterator) error {
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

func (c *WorkspaceLoadCollection) GetItems() interface{} {
	return c.Collection.GetItems()
}
