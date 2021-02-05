package adapt

import (
	"encoding/json"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// CollectionMap struct
type CollectionMap struct {
	Data map[string]Item
	IDs  []string
}

// GetItem function
func (c *CollectionMap) GetItem(index int) loadable.Item {
	key := c.IDs[index]
	item := c.Data[key]
	return &item
}

// NewItem function
func (c *CollectionMap) NewItem() loadable.Item {
	return nil
}

// GetItems function
func (c *CollectionMap) GetItems() interface{} {
	return nil
}

// Loop function
func (c *CollectionMap) Loop(iter func(item loadable.Item) error) error {
	for index := range c.IDs {
		err := iter(c.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (c *CollectionMap) Len() int {
	return len(c.Data)
}

// Slice function
func (c *CollectionMap) Slice(start int, end int) {

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
