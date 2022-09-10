package adapt

import (
	"errors"
	"strings"
)

type Item map[string]interface{}

func (i *Item) SetField(fieldName string, value interface{}) error {
	(*i)[fieldName] = value
	return nil
}

func (i *Item) GetField(fieldName string) (interface{}, error) {
	// Split the field name into tokens
	names := strings.Split(fieldName, "->")
	if len(names) == 1 {
		value, ok := (*i)[fieldName]
		if !ok {
			return nil, errors.New("Field not found: " + fieldName)
		}
		return value, nil
	}

	var value interface{}
	value = *i

	for _, name := range names {
		var err error
		value, err = GetFieldValue(value, name)
		if err != nil {
			return nil, errors.New("Field Path not found: " + fieldName)
		}
	}

	return value, nil
}

func (i *Item) Loop(iter func(string, interface{}) error) error {
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
