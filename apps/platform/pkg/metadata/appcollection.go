package metadata

// AppCollection slice
type AppCollection []App

// GetName function
func (ac *AppCollection) GetName() string {
	return "apps"
}

// GetFields function
func (ac *AppCollection) GetFields() []string {
	return []string{"id"}
}

// UnMarshal function
func (ac *AppCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(ac, data)
}

// Marshal function
func (ac *AppCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(ac)
}

// GetItem function
func (ac *AppCollection) GetItem(index int) CollectionableItem {
	actual := *ac
	return &actual[index]
}

// Loop function
func (ac *AppCollection) Loop(iter func(item CollectionableItem) error) error {
	for _, item := range *ac {
		err := iter(&item)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (ac *AppCollection) Len() int {
	return len(*ac)
}
