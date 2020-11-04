package metadata

// ProfileCollection slice
type ProfileCollection []Profile

// GetName function
func (pc *ProfileCollection) GetName() string {
	return "profiles"
}

// GetFields function
func (pc *ProfileCollection) GetFields() []string {
	return []string{"id"}
}

// NewItem function
func (pc *ProfileCollection) NewItem(key string) (BundleableItem, error) {
	return NewProfile(key)
}

// AddItem function
func (pc *ProfileCollection) AddItem(item BundleableItem) {
}

// UnMarshal function
func (pc *ProfileCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(pc, data)
}

// Marshal function
func (pc *ProfileCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(pc)
}

// GetItem function
func (pc *ProfileCollection) GetItem(index int) CollectionableItem {
	actual := *pc
	return &actual[index]
}
