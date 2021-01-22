package adapt

import (
	"encoding/json"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// Collection struct
type Collection struct {
	Data []Item `json:"data"`
}

// GetItem function
func (c *Collection) GetItem(index int) loadable.Item {
	return &c.Data[index]
}

// AddItem function
func (c *Collection) AddItem(item loadable.Item) {
	c.Data = append(c.Data, *item.(*Item))
}

// NewItem function
func (c *Collection) NewItem() loadable.Item {
	return &Item{}
}

// GetItems function
func (c *Collection) GetItems() interface{} {
	return c.Data
}

// Loop function
func (c *Collection) Loop(iter func(item loadable.Item) error) error {
	for index := range c.Data {
		err := iter(c.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (c *Collection) Len() int {
	return len(c.Data)
}

// MarshalJSON custom functionality
func (c *Collection) MarshalJSON() ([]byte, error) {
	return json.Marshal(c.Data)
}

// Slice function
func (c *Collection) Slice(start int, end int) {
	c.Data = c.Data[start:end]
}
