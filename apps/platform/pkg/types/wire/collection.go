package wire

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type Collection []*Item

func (c *Collection) NewItem() meta.Item {
	return &Item{}
}

func (c *Collection) AddItem(item meta.Item) error {
	*c = append(*c, item.(*Item))
	return nil
}

func (c *Collection) Loop(iter meta.GroupIterator) error {
	for index := range *c {
		err := iter((*c)[index], strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *Collection) First() *Item {
	return (*c)[0]
}

func (c *Collection) Len() int {
	return len(*c)
}

func (c *Collection) GroupByField(fieldName string) (map[string]meta.Item, error) {
	group := map[string]meta.Item{}
	for _, item := range *c {
		value, err := item.GetFieldAsString(fieldName)
		if err != nil {
			return nil, err
		}
		group[value] = item
	}
	return group, nil
}
