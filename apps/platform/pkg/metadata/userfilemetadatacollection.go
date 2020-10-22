package metadata

// UserFileMetadataCollection slice
type UserFileMetadataCollection []UserFileMetadata

// GetName function
func (cc *UserFileMetadataCollection) GetName() string {
	return "userfiles"
}

// GetFields function
func (cc *UserFileMetadataCollection) GetFields() []string {
	return []string{"name", "path", "recordid", "filecollectionid", "fieldid", "mimetype", "collectionid", "workspaceid", "siteid"}
}

// NewItem function
func (cc *UserFileMetadataCollection) NewItem() BundleableItem {
	var ufc UserFileCollection
	return &ufc
}

// AddItem function
func (cc *UserFileMetadataCollection) AddItem(item BundleableItem) {
}

// UnMarshal function
func (cc *UserFileMetadataCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(cc, data)
}

// Marshal function
func (cc *UserFileMetadataCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(cc)
}

// GetItem function
func (cc *UserFileMetadataCollection) GetItem(index int) CollectionableItem {
	actual := *cc
	return &actual[index]
}
