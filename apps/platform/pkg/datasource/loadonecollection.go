package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type LoadOneCollection struct {
	Collection meta.CollectionableGroup
	Item       loadable.Item
	Length     int
}

func (c *LoadOneCollection) GetItem(index int) loadable.Item {
	return c.Item
}

func (c *LoadOneCollection) NewItem() loadable.Item {
	c.Length++
	return c.Item
}

func (c *LoadOneCollection) Loop(iter loadable.GroupIterator) error {
	return iter(c.GetItem(0), "0")
}

func (c *LoadOneCollection) Len() int {
	return c.Length
}

func (c *LoadOneCollection) GetFields() []string {
	return c.Collection.GetFields()
}

func (c *LoadOneCollection) GetName() string {
	return c.Collection.GetName()
}

func (c *LoadOneCollection) GetItems() interface{} {
	return []LoadOneCollection{*c}
}
