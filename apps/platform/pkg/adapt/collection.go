package adapt

import (
	"bytes"
	"encoding/json"
	"strconv"

	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type Collection []*Item

func (c *Collection) UnmarshalJSON(data []byte) error {
	var jsonObj map[string]json.RawMessage
	err := json.Unmarshal(data, &jsonObj)
	if err != nil {
		// We failed at unmarshalling to an object. It's probably an array
		return json.Unmarshal(data, c)
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

func (c *Collection) MarshalJSON() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteByte('{')
	for i, item := range *c {
		if i > 0 {
			buf.WriteByte(',')
		}
		tempid, err := shortid.Generate()
		if err != nil {
			return nil, err
		}
		buf.WriteByte('"')
		buf.WriteString(tempid)
		buf.WriteByte('"')
		buf.WriteByte(':')
		data, err := json.Marshal(item)
		if err != nil {
			return nil, err
		}
		buf.Write(data)
	}
	buf.WriteByte('}')
	return buf.Bytes(), nil
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
