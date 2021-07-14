package adapt

import (
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
		err := iter(c.GetItem(index), index)
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

// Slice function
func (c *Collection) Slice(start int, end int) {
	*c = (*c)[start:end]
}

func (c *Collection) Filter(iter func(item loadable.Item) (bool, error)) error {
	filtered := Collection{}
	for index := range *c {
		item := (*c)[index]
		passed, err := iter(c.GetItem(index))
		if err != nil {
			return err
		}
		if passed {
			filtered = append(filtered, item)
		}
	}
	*c = filtered
	return nil
}
