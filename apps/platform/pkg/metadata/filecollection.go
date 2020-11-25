package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
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
	return NewFile(key)
}

// GetKeyPrefix function
func (fc *FileCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (fc *FileCollection) AddItem(item BundleableItem) {
	*fc = append(*fc, *item.(*File))
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

// Loop function
func (fc *FileCollection) Loop(iter func(item CollectionableItem) error) error {
	for index := range *fc {
		err := iter(fc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (fc *FileCollection) Len() int {
	return len(*fc)
}
