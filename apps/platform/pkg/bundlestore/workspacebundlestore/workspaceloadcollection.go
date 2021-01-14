package workspacebundlestore

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

type WorkspaceLoadCollection struct {
	Collection metadata.BundleableGroup
	Namespace  string
}

// GetItem function
func (c *WorkspaceLoadCollection) GetItem(index int) adapters.LoadableItem {
	return c.Collection.GetItem(index)
}

// AddItem function
func (c *WorkspaceLoadCollection) AddItem(item adapters.LoadableItem) {
	c.Collection.AddItem(item)
}

// NewItem function
func (c *WorkspaceLoadCollection) NewItem() adapters.LoadableItem {
	item := c.Collection.NewBundleableItem()
	item.SetNamespace(c.Namespace)
	return item
}

// Loop function
func (c *WorkspaceLoadCollection) Loop(iter func(item adapters.LoadableItem) error) error {
	return c.Collection.Loop(iter)
}

// Len function
func (c *WorkspaceLoadCollection) Len() int {
	return c.Collection.Len()
}

// GetFields function
func (c *WorkspaceLoadCollection) GetFields() []adapters.LoadRequestField {
	return c.Collection.GetFields()
}

// GetName function
func (c *WorkspaceLoadCollection) GetName() string {
	return c.Collection.GetName()
}

// GetItems function
func (c *WorkspaceLoadCollection) GetItems() interface{} {
	return c
}
