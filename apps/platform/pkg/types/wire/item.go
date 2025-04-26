package wire

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"
)

type Item map[string]any

func (i *Item) SetField(fieldName string, value any) error {
	(*i)[fieldName] = value
	return nil
}

func (i *Item) GetField(fieldName string) (any, error) {
	// Split the field name into tokens
	names := strings.Split(fieldName, constant.RefSep)
	if len(names) == 1 {
		value, ok := (*i)[fieldName]
		if !ok {
			return nil, fmt.Errorf("field not found: %s", fieldName)
		}
		return value, nil
	}

	var value any
	value = i

	for _, name := range names {
		var err error
		value, err = GetFieldValue(value, name)
		if err != nil {
			return nil, fmt.Errorf("field path not found: %s", fieldName)
		}
	}

	return value, nil
}

func (i *Item) GetFieldAsString(fieldName string) (string, error) {
	value, err := i.GetField(fieldName)
	if err != nil {
		return "", err
	}
	valueString, ok := value.(string)
	if !ok {
		return "", fmt.Errorf("cannot get field as string: %T", value)
	}
	return valueString, nil
}

func (i *Item) Loop(iter func(string, any) error) error {
	for key, val := range *i {
		err := iter(key, val)
		if err != nil {
			return err
		}
	}
	return nil
}

func (i *Item) Len() int {
	return len(*i)
}
