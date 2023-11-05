package adapt

import (
	"encoding/json"

	"github.com/francoispqt/gojay"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type ItemWithMetadata struct {
	data     meta.Item
	metadata *CollectionMetadata
}

func NewItemWithMetadata(metadata *CollectionMetadata, item meta.Item) *ItemWithMetadata {
	return &ItemWithMetadata{
		data:     item,
		metadata: metadata,
	}
}

func (i *ItemWithMetadata) ScanBytes(src []byte) error {
	return json.Unmarshal(src, i)
}

func (i *ItemWithMetadata) UnmarshalJSON(data []byte) error {
	return gojay.UnmarshalJSONObject(data, i)
}

func (i *ItemWithMetadata) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.data)
}

func (i *ItemWithMetadata) SetField(fieldName string, value interface{}) error {
	return i.data.SetField(fieldName, value)
}

func (i *ItemWithMetadata) GetField(fieldName string) (interface{}, error) {
	return i.data.GetField(fieldName)
}

func (i *ItemWithMetadata) Loop(iter func(string, interface{}) error) error {
	return i.data.Loop(iter)
}

func (i *ItemWithMetadata) Len() int {
	return i.data.Len()
}

func (i *ItemWithMetadata) UnmarshalJSONObject(dec *gojay.Decoder, k string) error {
	fieldMetadata, err := i.metadata.GetField(k)
	if err != nil {
		return err
	}

	var embedded gojay.EmbeddedJSON
	err = dec.EmbeddedJSON(&embedded)
	if err != nil {
		return err
	}

	var value interface{}
	err = json.Unmarshal(embedded, &value)
	if err != nil {
		return err
	}

	switch fieldMetadata.Type {
	case "NUMBER":
		if fieldMetadata.NumberMetadata != nil && fieldMetadata.NumberMetadata.Decimals == 0 {
			floatValue, ok := value.(float64)
			if ok {
				value = int64(floatValue)
			}
		}
	}
	return i.SetField(k, value)
}

// we return 0, it tells the Decoder to decode all keys
func (i *ItemWithMetadata) NKeys() int {
	return 0
}
