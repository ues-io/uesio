package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type LoadOneCollection struct {
	Item   meta.CollectionableItem
	Length int
}

func (c *LoadOneCollection) NewItem() meta.Item {
	return c.Item
}

func (c *LoadOneCollection) AddItem(item meta.Item) {
	c.Length++
}

func (c *LoadOneCollection) Loop(iter meta.GroupIterator) error {
	return iter(c.Item, "0")
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
