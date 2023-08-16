package adapt

import (
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type UsageMappingCollection []*Item

func (c *UsageMappingCollection) NewItem() meta.Item {
	return &Item{}
}

func (c *UsageMappingCollection) AddItem(item meta.Item) error {
	newItem := c.NewItem()
	item.Loop(func(fieldID string, value interface{}) error {
		err := newItem.SetField(strings.Replace(fieldID, "uesio/studio.", "uesio/core.", 1), value)
		if err != nil {
			return err
		}
		return nil
	})

	*c = append(*c, newItem.(*Item))
	return nil
}

func (c *UsageMappingCollection) Loop(iter meta.GroupIterator) error {
	for index := range *c {
		err := iter((*c)[index], strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *UsageMappingCollection) Len() int {
	return len(*c)
}
