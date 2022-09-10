package adapt

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/francoispqt/gojay"
	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type Collection []*Item

func (c *Collection) UnmarshalJSON(data []byte) error {
	return gojay.UnmarshalJSONObject(data, c)
}

func (c *Collection) UnmarshalJSONObject(dec *gojay.Decoder, key string) error {
	// Ignore the key and add to the collection
	item := &Item{}
	err := decodeEmbed(dec, item)
	if err != nil {
		return err
	}
	*c = append(*c, item)
	return nil
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
