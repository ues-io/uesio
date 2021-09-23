package adapt

import (
	"errors"
	"strings"
)

// Item struct
type Item map[string]interface{}

// SetField function
func (i *Item) SetField(fieldName string, value interface{}) error {
	(*i)[fieldName] = value
	return nil
}

// GetField function
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
		dataMap, ok := value.(Item)
		if !ok {
			return nil, nil
		}
		value, ok = dataMap[name]
		if !ok {
			return nil, errors.New("Field not found: " + fieldName)
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
