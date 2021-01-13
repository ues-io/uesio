package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// FileCollection slice
type FileCollection []File

// GetName function
func (fc *FileCollection) GetName() string {
	return "files"
}

// GetFields function
func (fc *FileCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(fc)
}

// NewItem function
func (fc *FileCollection) NewItem() adapters.LoadableItem {
	return &File{}
}

// NewBundleableItem function
func (fc *FileCollection) NewBundleableItem() BundleableItem {
	return &File{}
}

// NewBundleableItem function
func (fc *FileCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewFile(key)
}

// GetKeyFromPath function
func (fc *FileCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// AddItem function
func (fc *FileCollection) AddItem(item adapters.LoadableItem) {
	*fc = append(*fc, *item.(*File))
}

// GetItem function
func (fc *FileCollection) GetItem(index int) adapters.LoadableItem {
	actual := *fc
	return &actual[index]
}

// Loop function
func (fc *FileCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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
