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
