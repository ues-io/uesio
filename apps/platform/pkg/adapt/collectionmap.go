package adapt

import (
	"encoding/json"

	"github.com/francoispqt/gojay"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type CollectionMap struct {
	Data     map[string]*ItemWithMetadata
	IDs      []string
	raw      json.RawMessage
	metadata *CollectionMetadata
}

func (c *CollectionMap) SetMetadata(metadata *CollectionMetadata) error {
	c.metadata = metadata
	// If we already have data defined here, we can quit now
	if c.Data != nil {
		return nil
	}
	c.IDs = []string{}
	c.Data = map[string]*ItemWithMetadata{}
	err := gojay.UnmarshalJSONObject(c.raw, c)
	if err != nil {
		return nil
	}
	// Clean up te raw data
	c.raw = nil
	return nil
}

func (c *CollectionMap) NewItem() meta.Item {
	return nil
}

func (c *CollectionMap) AddItem(item meta.Item) error {
	return nil
}

func (c *CollectionMap) Loop(iter meta.GroupIterator) error {
	if c == nil {
		return nil
	}
	for _, key := range c.IDs {
		item := c.Data[key]
		err := iter(item, key)
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
	return json.Unmarshal(b, &c.raw)
}

func (c *CollectionMap) MarshalJSON() ([]byte, error) {
	return json.Marshal(c.Data)
}

func (c *CollectionMap) UnmarshalJSONObject(dec *gojay.Decoder, k string) error {
	newItem := NewItemWithMetadata(c.metadata, &Item{})
	err := dec.AddObject(newItem)
	if err != nil {
		return err
	}
	c.Data[k] = newItem
	c.IDs = append(c.IDs, k)
	return nil
}

// we return 0, it tells the Decoder to decode all keys
func (c *CollectionMap) NKeys() int {
	return 0
}
