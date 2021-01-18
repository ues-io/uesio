package adapters

import (
	"encoding/json"
)

// Collection struct
type Collection struct {
	Data []Item `json:"data"`
}

// GetItem function
func (c *Collection) GetItem(index int) LoadableItem {
	return &c.Data[index]
}

// AddItem function
func (c *Collection) AddItem(item LoadableItem) {
	c.Data = append(c.Data, *item.(*Item))
}

// NewItem function
func (c *Collection) NewItem() LoadableItem {
	return &Item{}
}

// GetItems function
func (c *Collection) GetItems() interface{} {
	return c.Data
}

// Loop function
func (c *Collection) Loop(iter func(item LoadableItem) error) error {
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
