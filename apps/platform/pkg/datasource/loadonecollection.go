package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

type LoadOneCollection struct {
	Collection metadata.CollectionableGroup
	Item       adapters.LoadableItem
	Length     int
}

// GetItem function
func (c *LoadOneCollection) GetItem(index int) adapters.LoadableItem {
	return c.Item
}

// AddItem function
func (c *LoadOneCollection) AddItem(item adapters.LoadableItem) {
	// Do nothing
}

// NewItem function
func (c *LoadOneCollection) NewItem() adapters.LoadableItem {
	c.Length++
	return c.Item
}

// Loop function
func (c *LoadOneCollection) Loop(iter func(item adapters.LoadableItem) error) error {
	return iter(c.GetItem(0))
}

// Len function
func (c *LoadOneCollection) Len() int {
	return c.Length
}

// GetFields function
func (c *LoadOneCollection) GetFields() []adapters.LoadRequestField {
	return c.Collection.GetFields()
}

// GetName function
func (c *LoadOneCollection) GetName() string {
	return c.Collection.GetName()
}
