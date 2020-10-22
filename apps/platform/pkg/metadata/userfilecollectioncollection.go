package metadata

// UserFileCollectionCollection slice
type UserFileCollectionCollection []UserFileCollection

// GetName function
func (ufcc *UserFileCollectionCollection) GetName() string {
	return "filecollections"
}

// GetFields function
func (ufcc *UserFileCollectionCollection) GetFields() []string {
	return []string{"name", "filesource", "bucket"}
}

// NewItem function
func (ufcc *UserFileCollectionCollection) NewItem() BundleableItem {
	var ufc UserFileCollection
	return &ufc
}

// AddItem function
func (ufcc *UserFileCollectionCollection) AddItem(item BundleableItem) {
}

// UnMarshal function
func (ufcc *UserFileCollectionCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(ufcc, data)
}

// Marshal function
func (ufcc *UserFileCollectionCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(ufcc)
}

// GetItem function
func (ufcc *UserFileCollectionCollection) GetItem(index int) CollectionableItem {
	actual := *ufcc
	return &actual[index]
}
