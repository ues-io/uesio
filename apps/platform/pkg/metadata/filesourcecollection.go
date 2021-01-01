package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// FileSourceCollection slice
type FileSourceCollection []FileSource

// GetName function
func (fsc *FileSourceCollection) GetName() string {
	return "FileSources"
}

// GetFields function
func (fsc *FileSourceCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(fsc)
}

// NewItem function
func (fsc *FileSourceCollection) NewItem() LoadableItem {
	return &FileSource{}
}

// NewBundleableItem function
func (fsc *FileSourceCollection) NewBundleableItem(key string) (BundleableItem, error) {
	return NewFileSource(key)
}

// GetKeyPrefix function
func (fsc *FileSourceCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (fsc *FileSourceCollection) AddItem(item LoadableItem) {
	*fsc = append(*fsc, *item.(*FileSource))
}

// GetItem function
func (fsc *FileSourceCollection) GetItem(index int) LoadableItem {
	actual := *fsc
	return &actual[index]
}

// Loop function
func (fsc *FileSourceCollection) Loop(iter func(item LoadableItem) error) error {
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
