package adapt

import (
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
		return (*i)[fieldName], nil
	}

	var value interface{}
	value = *i

	for _, name := range names {
		dataMap, ok := value.(Item)
		if !ok {
			return nil, nil
		}
		value = dataMap[name]
	}

	return value, nil

}
