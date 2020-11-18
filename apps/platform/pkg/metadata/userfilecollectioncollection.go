package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// UserFileCollectionCollection slice
type UserFileCollectionCollection []UserFileCollection

// GetName function
func (ufcc *UserFileCollectionCollection) GetName() string {
	return "filecollections"
}

// GetFields function
func (ufcc *UserFileCollectionCollection) GetFields() []string {
	return []string{"name", "filesource", "bucket"}
}

// NewItem function
func (ufcc *UserFileCollectionCollection) NewItem(key string) (BundleableItem, error) {
	return NewUserFileCollection(key)
}

// GetKeyPrefix function
func (ufcc *UserFileCollectionCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (ufcc *UserFileCollectionCollection) AddItem(item BundleableItem) {
}

// UnMarshal function
func (ufcc *UserFileCollectionCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(ufcc, data)
}

// Marshal function
func (ufcc *UserFileCollectionCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(ufcc)
}

// GetItem function
func (ufcc *UserFileCollectionCollection) GetItem(index int) CollectionableItem {
	actual := *ufcc
	return &actual[index]
}

// Loop function
func (ufcc *UserFileCollectionCollection) Loop(iter func(item CollectionableItem) error) error {
	for index := range *ufcc {
		err := iter(ufcc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (ufcc *UserFileCollectionCollection) Len() int {
	return len(*ufcc)
}
