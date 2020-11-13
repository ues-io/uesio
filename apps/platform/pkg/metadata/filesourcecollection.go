package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// FileSourceCollection slice
type FileSourceCollection []FileSource

// GetName function
func (fsc *FileSourceCollection) GetName() string {
	return "FileSources"
}

// GetFields function
func (fsc *FileSourceCollection) GetFields() []string {
	return []string{"id"}
}

// NewItem function
func (fsc *FileSourceCollection) NewItem(key string) (BundleableItem, error) {
	return NewFileSource(key)
}

// GetKeyPrefix function
func (fsc *FileSourceCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (fsc *FileSourceCollection) AddItem(item BundleableItem) {
}

// UnMarshal function
func (fsc *FileSourceCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(fsc, data)
}

// Marshal function
func (fsc *FileSourceCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(fsc)
}

// GetItem function
func (fsc *FileSourceCollection) GetItem(index int) CollectionableItem {
	actual := *fsc
	return &actual[index]
}

// Loop function
func (fsc *FileSourceCollection) Loop(iter func(item CollectionableItem) error) error {
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
