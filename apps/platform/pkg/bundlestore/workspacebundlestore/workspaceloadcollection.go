package workspacebundlestore

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type WorkspaceLoadCollection struct {
	Collection meta.BundleableGroup
	Namespace  string
}

// GetItem function
func (c *WorkspaceLoadCollection) GetItem(index int) loadable.Item {
	return c.Collection.GetItem(index)
}

// NewItem function
func (c *WorkspaceLoadCollection) NewItem() loadable.Item {
	item := c.Collection.NewItem().(meta.BundleableItem)
	item.SetNamespace(c.Namespace)
	return item
}

// Loop function
func (c *WorkspaceLoadCollection) Loop(iter func(item loadable.Item) error) error {
	return c.Collection.Loop(iter)
}

// Len function
func (c *WorkspaceLoadCollection) Len() int {
	return c.Collection.Len()
}

// GetFields function
func (c *WorkspaceLoadCollection) GetFields() []string {
	return c.Collection.GetFields()
}

// GetName function
func (c *WorkspaceLoadCollection) GetName() string {
	return c.Collection.GetName()
}

// GetItems function
func (c *WorkspaceLoadCollection) GetItems() interface{} {
	return c.Collection.GetItems()
}

// Slice function
func (c *WorkspaceLoadCollection) Slice(start int, end int) {
}
