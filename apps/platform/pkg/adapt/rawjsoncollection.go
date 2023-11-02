package adapt

import (
	"encoding/json"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type RawJSONCollection []*RawJSONItem

func (c *RawJSONCollection) UnmarshalJSON(data []byte) error {
	var jsonObj map[string]json.RawMessage
	err := json.Unmarshal(data, &jsonObj)
	if err != nil {
		// We failed at unmarshalling to an object. It's probably an array
		// Since we've overridden the UnmarshalJSON for this type,
		// we can't just unmarshall straight into c, so unmarshall into an alias
		type Alias RawJSONCollection
		return json.Unmarshal(data, (*Alias)(c))
	}

	for _, data := range jsonObj {
		item := &RawJSONItem{}
		err = json.Unmarshal(data, item)
		if err != nil {
			return err
		}
		*c = append(*c, item)
	}

	return nil
}

func (c *RawJSONCollection) NewItem() meta.Item {
	return &RawJSONItem{}
}

func (c *RawJSONCollection) AddItem(item meta.Item) error {
	*c = append(*c, item.(*RawJSONItem))
	return nil
}

func (c *RawJSONCollection) Loop(iter meta.GroupIterator) error {
	for index := range *c {
		err := iter((*c)[index], strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *RawJSONCollection) First() *RawJSONItem {
	return (*c)[0]
}

func (c *RawJSONCollection) Len() int {
	return len(*c)
}

func (c *RawJSONCollection) GroupByField(fieldName string) (map[string]meta.Item, error) {
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
