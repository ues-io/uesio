package metadata

// FileCollection slice
type FileCollection []File

// GetName function
func (fc *FileCollection) GetName() string {
	return "files"
}

// GetFields function
func (fc *FileCollection) GetFields() []string {
	return []string{"id", "name", "workspaceid", "content"}
}

// NewItem function
func (fc *FileCollection) NewItem() BundleableItem {
	var file File
	return &file
}

// AddItem function
func (fc *FileCollection) AddItem(item BundleableItem) {
	actual := *fc
	file := item.(*File)
	actual = append(actual, *file)
	*fc = actual
}

// UnMarshal function
func (fc *FileCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(fc, data)
}

// Marshal function
func (fc *FileCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(fc)
}

// GetItem function
func (fc *FileCollection) GetItem(index int) CollectionableItem {
	actual := *fc
	return &actual[index]
}
