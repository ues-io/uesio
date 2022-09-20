package adapt

import (
	"encoding/json"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type CollectionMap struct {
	Data map[string]Item
	IDs  []string
}

func (c *CollectionMap) GetItem(index int) loadable.Item {
	key := c.IDs[index]
	item := c.Data[key]
	return &item
}

func (c *CollectionMap) NewItem() loadable.Item {
	return nil
}

func (c *CollectionMap) GetItems() interface{} {
	return nil
}

func (c *CollectionMap) Loop(iter loadable.GroupIterator) error {
	for index, key := range c.IDs {
		err := iter(c.GetItem(index), key)
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *CollectionMap) Len() int {
	return len(c.Data)
}

func (c *CollectionMap) UnmarshalJSON(b []byte) error {
	err := json.Unmarshal(b, &c.Data)
	if err != nil {
		return err
	}

	for k := range c.Data {
		c.IDs = append(c.IDs, k)
	}

	return nil
}

func (c *CollectionMap) MarshalJSON() ([]byte, error) {
	return json.Marshal(c.Data)
}
