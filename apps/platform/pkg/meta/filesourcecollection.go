package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// FileSourceCollection slice
type FileSourceCollection []FileSource

// GetName function
func (fsc *FileSourceCollection) GetName() string {
	return "studio.filesources"
}

// GetFields function
func (fsc *FileSourceCollection) GetFields() []string {
	return StandardGetFields(&FileSource{})
}

// NewItem function
func (fsc *FileSourceCollection) NewItem() loadable.Item {
	*fsc = append(*fsc, FileSource{})
	return &(*fsc)[len(*fsc)-1]
}

// NewBundleableItemWithKey function
func (fsc *FileSourceCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	fs, err := NewFileSource(key)
	if err != nil {
		return nil, err
	}
	*fsc = append(*fsc, *fs)
	return &(*fsc)[len(*fsc)-1], nil
}

// GetKeyFromPath function
func (fsc *FileSourceCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
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
