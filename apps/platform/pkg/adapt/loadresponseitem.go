package adapt

// Item struct
type Item map[string]interface{}

// SetField function
func (i *Item) SetField(fieldName string, value interface{}) error {
	actual := *i
	actual[fieldName] = value
	return nil
}

// GetField function
func (i *Item) GetField(fieldName string) (interface{}, error) {
	actual := *i
	return actual[fieldName], nil
}
