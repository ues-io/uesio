package adapt

import (
	"encoding/json"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type Collection []*Item

func (c *Collection) UnmarshalJSON(data []byte) error {
	var jsonObj map[string]json.RawMessage
	err := json.Unmarshal(data, &jsonObj)
	if err != nil {
		// We failed at unmarshalling to an object. It's probably an array
		// Since we've overridden the UnmarshalJSON for this type,
		// we can't just unmarshall straight into c, so unmarshall into an alias
		type Alias Collection
		return json.Unmarshal(data, (*Alias)(c))
	}

	for _, data := range jsonObj {
		item := &Item{}
		err = json.Unmarshal(data, item)
		if err != nil {
			return err
		}
		*c = append(*c, item)
	}

	return nil
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
