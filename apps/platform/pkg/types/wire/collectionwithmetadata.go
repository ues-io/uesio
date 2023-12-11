package wire

import (
	"encoding/json"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type CollectionWithMetadata struct {
	data     []*ItemWithMetadata
	metadata *CollectionMetadata
}

func (c *CollectionWithMetadata) UnmarshalJSON(data []byte) error {
	return json.Unmarshal(data, &c.data)
}

func (c *CollectionWithMetadata) MarshalJSON() ([]byte, error) {
	if c.data == nil {
		c.data = []*ItemWithMetadata{}
	}
	return json.Marshal(c.data)
}

func (c *CollectionWithMetadata) SetMetadata(metadata *CollectionMetadata) error {
	c.metadata = metadata
	return nil
}

func (c *CollectionWithMetadata) NewItem() meta.Item {
	return NewItemWithMetadata(c.metadata, &Item{})
}

func (c *CollectionWithMetadata) AddItem(item meta.Item) error {
	c.data = append(c.data, item.(*ItemWithMetadata))
	return nil
}

func (c *CollectionWithMetadata) Loop(iter meta.GroupIterator) error {
	for index := range c.data {
		err := iter((c.data)[index], strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *CollectionWithMetadata) Len() int {
	return len(c.data)
}
