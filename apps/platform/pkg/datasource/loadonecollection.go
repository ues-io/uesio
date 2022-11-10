package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type LoadOneCollection struct {
	Collection meta.CollectionableGroup
	Item       meta.Item
	Length     int
}

func (c *LoadOneCollection) GetItem(index int) meta.Item {
	return c.Item
}

func (c *LoadOneCollection) NewItem() meta.Item {
	return c.Item
}

func (c *LoadOneCollection) AddItem(item meta.Item) {
	c.Length++
}

func (c *LoadOneCollection) Loop(iter meta.GroupIterator) error {
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
