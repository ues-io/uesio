package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type LoadOneCollection struct {
	Item   meta.CollectionableItem
	Length int
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
	return meta.StandardGetFields(c.Item)
}

func (c *LoadOneCollection) GetName() string {
	return c.Item.GetCollectionName()
}

func (c *LoadOneCollection) GetItems() interface{} {
	return []LoadOneCollection{*c}
}
