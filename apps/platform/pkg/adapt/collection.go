package adapt

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type Collection []*Item

func (c *Collection) GetItem(index int) loadable.Item {
	return (*c)[index]
}

func (c *Collection) NewItem() loadable.Item {
	item := &Item{}
	*c = append(*c, item)
	return item
}

func (c *Collection) GetItems() interface{} {
	return *c
}

func (c *Collection) Loop(iter loadable.GroupIterator) error {
	for index := range *c {
		err := iter(c.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *Collection) Len() int {
	return len(*c)
}
