package adapt

import (
	"encoding/json"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type CollectionMap struct {
	Data map[string]Item
	IDs  []string
}

func (c *CollectionMap) GetItem(index int) meta.Item {
	key := c.IDs[index]
	item := c.Data[key]
	return &item
}

func (c *CollectionMap) NewItem() meta.Item {
	return nil
}

func (c *CollectionMap) AddItem(item meta.Item) {

}

func (c *CollectionMap) GetItems() interface{} {
	return nil
}

func (c *CollectionMap) Loop(iter meta.GroupIterator) error {
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
