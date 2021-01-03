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
func (fc *FileCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(fc)
}

// NewItem function
func (fc *FileCollection) NewItem() LoadableItem {
	return &File{}
}

// NewBundleableItem function
func (fc *FileCollection) NewBundleableItem(key string) (BundleableItem, error) {
	return NewFile(key)
}

// GetKeyPrefix function
func (fc *FileCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (fc *FileCollection) AddItem(item LoadableItem) {
	*fc = append(*fc, *item.(*File))
}

// GetItem function
func (fc *FileCollection) GetItem(index int) LoadableItem {
	actual := *fc
	return &actual[index]
}

// Loop function
func (fc *FileCollection) Loop(iter func(item LoadableItem) error) error {
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
