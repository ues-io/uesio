package metadata

// UserFileMetadataCollection slice
type UserFileMetadataCollection []UserFileMetadata

// GetName function
func (ufmc *UserFileMetadataCollection) GetName() string {
	return "userfiles"
}

// GetFields function
func (ufmc *UserFileMetadataCollection) GetFields() []string {
	return []string{"name", "path", "recordid", "filecollectionid", "fieldid", "mimetype", "collectionid", "workspaceid", "siteid"}
}

// AddItem function
func (ufmc *UserFileMetadataCollection) AddItem(item BundleableItem) {
}

// UnMarshal function
func (ufmc *UserFileMetadataCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(ufmc, data)
}

// Marshal function
func (ufmc *UserFileMetadataCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(ufmc)
}

// GetItem function
func (ufmc *UserFileMetadataCollection) GetItem(index int) CollectionableItem {
	actual := *ufmc
	return &actual[index]
}

// Loop function
func (ufmc *UserFileMetadataCollection) Loop(iter func(item CollectionableItem) error) error {
	for index := range *ufmc {
		err := iter(ufmc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (ufmc *UserFileMetadataCollection) Len() int {
	return len(*ufmc)
}
