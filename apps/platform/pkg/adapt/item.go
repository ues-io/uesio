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

	subFieldMap, err := i.GetField(names[0])
	if err != nil {
		return nil, err
	}

	lmap, ok := subFieldMap.(map[string]interface{})
	if !ok {
		return nil, errors.New("SubField is not a map")
	}

	return lmap[names[1]], nil
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
