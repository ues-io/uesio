package adapt

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/francoispqt/gojay"
	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type Collection []*Item

func (c *Collection) UnmarshalJSON(data []byte) error {
	err := gojay.UnmarshalJSONObject(data, c)
	if err != nil {
		return gojay.UnmarshalJSONArray(data, c)
	}
	return err
}

func (c *Collection) UnmarshalJSONArray(dec *gojay.Decoder) error {
	item := &Item{}
	err := decodeEmbed(dec, item)
	if err != nil {
		return err
	}
	*c = append(*c, item)
	return nil
}

func (c *Collection) UnmarshalJSONObject(dec *gojay.Decoder, key string) error {
	// Ignore the key and add to the collection
	return c.UnmarshalJSONArray(dec)
}

func (c *Collection) NKeys() int {
	return 0
}

func (c *Collection) MarshalJSON() ([]byte, error) {
	return gojay.MarshalJSONObject(c)
}

func (c *Collection) MarshalJSONObject(enc *gojay.Encoder) {
	for _, item := range *c {
		data, err := json.Marshal(item)
		if err != nil {
			fmt.Println("Error Marshalling Collection")
			break
		}

		embed := gojay.EmbeddedJSON(data)
		tempid, _ := shortid.Generate()
		enc.AddEmbeddedJSONKey(tempid, &embed)
	}
}

func (c *Collection) IsNil() bool {
	return c == nil
}

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

func (c *Collection) Len() int {
	return len(*c)
}
