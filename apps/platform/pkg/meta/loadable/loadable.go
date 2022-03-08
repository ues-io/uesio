package loadable

type GroupIterator func(item Item, index string) error

// Group interface
type Group interface {
	GetItem(index int) Item
	Loop(iter GroupIterator) error
	Len() int
	NewItem() Item
	GetItems() interface{}
}

// Item interface
type Item interface {
	SetField(string, interface{}) error
	GetField(string) (interface{}, error)
	Loop(iter func(string, interface{}) error) error
	Len() int
}

func FindMissing(group Group, keyFunc func(item Item) string, needed []string) ([]string, error) {
	returnedValues := map[string]bool{}
	missing := []string{}
	err := group.Loop(func(item Item, index string) error {
		value := keyFunc(item)
		returnedValues[value] = true
		return nil
	})
	if err != nil {
		return missing, err
	}

	for _, value := range needed {
		_, ok := returnedValues[value]
		if !ok {
			missing = append(missing, value)
		}
	}
	return missing, nil
}
