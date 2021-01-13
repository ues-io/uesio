package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// FileSourceCollection slice
type FileSourceCollection []FileSource

// GetName function
func (fsc *FileSourceCollection) GetName() string {
	return "FileSources"
}

// GetFields function
func (fsc *FileSourceCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(fsc)
}

// NewItem function
func (fsc *FileSourceCollection) NewItem() adapters.LoadableItem {
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
func (fsc *FileSourceCollection) AddItem(item adapters.LoadableItem) {
	*fsc = append(*fsc, *item.(*FileSource))
}

// GetItem function
func (fsc *FileSourceCollection) GetItem(index int) adapters.LoadableItem {
	actual := *fsc
	return &actual[index]
}

// Loop function
func (fsc *FileSourceCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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
