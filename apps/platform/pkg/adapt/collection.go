package adapt

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// Collection struct
type Collection []Item

// GetItem function
func (c *Collection) GetItem(index int) loadable.Item {
	return &(*c)[index]
}

// NewItem function
func (c *Collection) NewItem() loadable.Item {
	*c = append(*c, Item{})
	return &(*c)[len(*c)-1]
}

// GetItems function
func (c *Collection) GetItems() interface{} {
	return *c
}

// Loop function
func (c *Collection) Loop(iter loadable.GroupIterator) error {
	for index := range *c {
		err := iter(c.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (c *Collection) Len() int {
	return len(*c)
}
