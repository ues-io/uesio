package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/metadata/loadable"
)

// FileSourceCollection slice
type FileSourceCollection []FileSource

// GetName function
func (fsc *FileSourceCollection) GetName() string {
	return "FileSources"
}

// GetFields function
func (fsc *FileSourceCollection) GetFields() []string {
	return StandardGetFields(fsc)
}

// NewItem function
func (fsc *FileSourceCollection) NewItem() loadable.Item {
	return &FileSource{}
}

// NewBundleableItem function
func (fsc *FileSourceCollection) NewBundleableItem() BundleableItem {
	return &FileSource{}
}

// NewBundleableItem function
func (fsc *FileSourceCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewFileSource(key)
}

// GetKeyFromPath function
func (fsc *FileSourceCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// AddItem function
func (fsc *FileSourceCollection) AddItem(item loadable.Item) {
	*fsc = append(*fsc, *item.(*FileSource))
}

// GetItem function
func (fsc *FileSourceCollection) GetItem(index int) loadable.Item {
	return &(*fsc)[index]
}

// Loop function
func (fsc *FileSourceCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *fsc {
		err := iter(fsc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (fsc *FileSourceCollection) Len() int {
	return len(*fsc)
}

// GetItems function
func (fsc *FileSourceCollection) GetItems() interface{} {
	return fsc
}

// Slice function
func (fsc *FileSourceCollection) Slice(start int, end int) {

}
