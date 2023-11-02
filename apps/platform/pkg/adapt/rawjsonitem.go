package adapt

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
)

type RawJSONItem json.RawMessage

func (i *RawJSONItem) ScanBytes(v []byte) error {
	return json.Unmarshal(v, i)
}

func (i *RawJSONItem) UnmarshalJSON(data []byte) error {
	return json.Unmarshal(data, (*json.RawMessage)(i))
}

func (i *RawJSONItem) MarshalJSON() ([]byte, error) {
	return json.Marshal((*json.RawMessage)(i))
}

func (i *RawJSONItem) SetField(fieldName string, value interface{}) error {
	result, err := sjson.SetBytes(*i, gjson.Escape(fieldName), value)
	if err != nil {
		return err
	}
	*i = result
	return nil
}

func (i *RawJSONItem) GetField(fieldName string) (interface{}, error) {
	names := strings.Split(fieldName, constant.RefSep)
	escapedNames := make([]string, len(names))
	for i, name := range names {
		escapedNames[i] = gjson.Escape(name)
	}
	return gjson.GetBytes(*i, strings.Join(escapedNames, ".")).Value(), nil
}

func (i *RawJSONItem) GetFieldAsString(fieldName string) (string, error) {
	value, err := i.GetField(fieldName)
	if err != nil {
		return "", err
	}
	valueString, ok := value.(string)
	if !ok {
		return "", fmt.Errorf("Cannot get field as string: %T", value)
	}
	return valueString, nil
}

func (i *RawJSONItem) Loop(iter func(string, interface{}) error) error {
	for key, value := range gjson.ParseBytes(*i).Map() {
		err := iter(key, value)
		if err != nil {
			return err
		}
	}
	return nil
}

func (i *RawJSONItem) Len() int {
	return len(gjson.ParseBytes(*i).Map())
}
