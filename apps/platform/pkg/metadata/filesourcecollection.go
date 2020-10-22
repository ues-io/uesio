package metadata

// FileSourceCollection slice
type FileSourceCollection []FileSource

// GetName function
func (dsc *FileSourceCollection) GetName() string {
	return "FileSources"
}

// GetFields function
func (dsc *FileSourceCollection) GetFields() []string {
	return []string{"id"}
}

// NewItem function
func (dsc *FileSourceCollection) NewItem() BundleableItem {
	var FileSource FileSource
	return &FileSource
}

// AddItem function
func (dsc *FileSourceCollection) AddItem(item BundleableItem) {
}

// UnMarshal function
func (dsc *FileSourceCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(dsc, data)
}

// Marshal function
func (dsc *FileSourceCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(dsc)
}

// GetItem function
func (dsc *FileSourceCollection) GetItem(index int) CollectionableItem {
	actual := *dsc
	return &actual[index]
}
