package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

type LoadOneCollection struct {
	Collection metadata.CollectionableGroup
	Item       metadata.LoadableItem
	Length     int
}

// GetItem function
func (c *LoadOneCollection) GetItem(index int) metadata.LoadableItem {
	return c.Item
}

// AddItem function
func (c *LoadOneCollection) AddItem(item metadata.LoadableItem) {
	// Do nothing
}

// NewItem function
func (c *LoadOneCollection) NewItem() metadata.LoadableItem {
	c.Length++
	return c.Item
}

// Loop function
func (c *LoadOneCollection) Loop(iter func(item metadata.LoadableItem) error) error {
	return iter(c.GetItem(0))
}

// Len function
func (c *LoadOneCollection) Len() int {
	return c.Length
}

// GetFields function
func (c *LoadOneCollection) GetFields() []reqs.LoadRequestField {
	return c.Collection.GetFields()
}

// GetName function
func (c *LoadOneCollection) GetName() string {
	return c.Collection.GetName()
}
