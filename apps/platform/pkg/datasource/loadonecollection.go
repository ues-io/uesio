package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

//LoadOneCollection type
type LoadOneCollection struct {
	Collection meta.CollectionableGroup
	Item       loadable.Item
	Length     int
}

// GetItem function
func (c *LoadOneCollection) GetItem(index int) loadable.Item {
	return c.Item
}

// NewItem function
func (c *LoadOneCollection) NewItem() loadable.Item {
	c.Length++
	return c.Item
}

// Loop function
func (c *LoadOneCollection) Loop(iter loadable.GroupIterator) error {
	return iter(c.GetItem(0), "0")
}

// Len function
func (c *LoadOneCollection) Len() int {
	return c.Length
}

// GetFields function
func (c *LoadOneCollection) GetFields() []string {
	return c.Collection.GetFields()
}

// GetName function
func (c *LoadOneCollection) GetName() string {
	return c.Collection.GetName()
}

// GetItems function
func (c *LoadOneCollection) GetItems() interface{} {
	return []LoadOneCollection{*c}
}
