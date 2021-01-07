package workspacebundlestore

import (
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

type WorkspaceLoadCollection struct {
	Collection metadata.BundleableGroup
	Namespace  string
}

// GetItem function
func (c *WorkspaceLoadCollection) GetItem(index int) metadata.LoadableItem {
	return c.Collection.GetItem(index)
}

// AddItem function
func (c *WorkspaceLoadCollection) AddItem(item metadata.LoadableItem) {
	c.Collection.AddItem(item)
}

// NewItem function
func (c *WorkspaceLoadCollection) NewItem() metadata.LoadableItem {
	item := c.Collection.NewBundleableItem()
	item.SetNamespace(c.Namespace)
	return item
}

// Loop function
func (c *WorkspaceLoadCollection) Loop(iter func(item metadata.LoadableItem) error) error {
	return c.Collection.Loop(iter)
}

// Len function
func (c *WorkspaceLoadCollection) Len() int {
	return c.Collection.Len()
}

// GetFields function
func (c *WorkspaceLoadCollection) GetFields() []reqs.LoadRequestField {
	return c.Collection.GetFields()
}

// GetName function
func (c *WorkspaceLoadCollection) GetName() string {
	return c.Collection.GetName()
}
