package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// UserFileCollectionCollection slice
type UserFileCollectionCollection []UserFileCollection

// GetName function
func (ufcc *UserFileCollectionCollection) GetName() string {
	return "uesio/studio.filecollections"
}

// GetFields function
func (ufcc *UserFileCollectionCollection) GetFields() []string {
	return StandardGetFields(&UserFileCollection{})
}

// NewItem function
func (ufcc *UserFileCollectionCollection) NewItem() loadable.Item {
	*ufcc = append(*ufcc, UserFileCollection{})
	return &(*ufcc)[len(*ufcc)-1]
}

// NewBundleableItemWithKey function
func (ufcc *UserFileCollectionCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	ufc, err := NewUserFileCollection(key)
	if err != nil {
		return nil, err
	}
	*ufcc = append(*ufcc, *ufc)
	return &(*ufcc)[len(*ufcc)-1], nil
}

// GetKeyFromPath function
func (ufcc *UserFileCollectionCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

// GetItem function
func (ufcc *UserFileCollectionCollection) GetItem(index int) loadable.Item {
	return &(*ufcc)[index]
}

// Loop function
func (ufcc *UserFileCollectionCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *ufcc {
		err := iter(ufcc.GetItem(index), strconv.Itoa(index))
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
	return *ufcc
}
