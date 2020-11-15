package metadata

// UserCollection slice
type UserCollection []User

// GetName function
func (uc *UserCollection) GetName() string {
	return "users"
}

// GetFields function
func (uc *UserCollection) GetFields() []string {
	return []string{"id", "firstname", "lastname", "profile"}
}

// UnMarshal function
func (uc *UserCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(uc, data)
}

// Marshal function
func (uc *UserCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(uc)
}

// GetItem function
func (uc *UserCollection) GetItem(index int) CollectionableItem {
	actual := *uc
	return &actual[index]
}

// Loop function
func (uc *UserCollection) Loop(iter func(item CollectionableItem) error) error {
	for index := range *uc {
		err := iter(uc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (uc *UserCollection) Len() int {
	return len(*uc)
}
