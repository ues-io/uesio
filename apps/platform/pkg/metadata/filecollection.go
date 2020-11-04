package metadata

import (
	"errors"
	"strings"
)

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
func (fc *FileCollection) NewItem(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid File Key: " + key)
	}
	return &File{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
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
