package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// UserFileCollectionCollection slice
type UserFileCollectionCollection []UserFileCollection

// GetName function
func (ufcc *UserFileCollectionCollection) GetName() string {
	return "filecollections"
}

// GetFields function
func (ufcc *UserFileCollectionCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(ufcc)
}

// NewItem function
func (ufcc *UserFileCollectionCollection) NewItem() adapters.LoadableItem {
	return &UserFileCollection{}
}

// NewBundleableItem function
func (ufcc *UserFileCollectionCollection) NewBundleableItem() BundleableItem {
	return &UserFileCollection{}
}

// NewBundleableItem function
func (ufcc *UserFileCollectionCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewUserFileCollection(key)
}

// GetKeyFromPath function
func (ufcc *UserFileCollectionCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// AddItem function
func (ufcc *UserFileCollectionCollection) AddItem(item adapters.LoadableItem) {
	*ufcc = append(*ufcc, *item.(*UserFileCollection))
}

// GetItem function
func (ufcc *UserFileCollectionCollection) GetItem(index int) adapters.LoadableItem {
	return &(*ufcc)[index]
}

// Loop function
func (ufcc *UserFileCollectionCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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

// GetItems function
func (ufcc *UserFileCollectionCollection) GetItems() interface{} {
	return ufcc
}
