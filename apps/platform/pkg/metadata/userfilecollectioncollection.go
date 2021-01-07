package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// UserFileCollectionCollection slice
type UserFileCollectionCollection []UserFileCollection

// GetName function
func (ufcc *UserFileCollectionCollection) GetName() string {
	return "filecollections"
}

// GetFields function
func (ufcc *UserFileCollectionCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(ufcc)
}

// NewItem function
func (ufcc *UserFileCollectionCollection) NewItem() LoadableItem {
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

// GetKeyPrefix function
func (ufcc *UserFileCollectionCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (ufcc *UserFileCollectionCollection) AddItem(item LoadableItem) {
	*ufcc = append(*ufcc, *item.(*UserFileCollection))
}

// GetItem function
func (ufcc *UserFileCollectionCollection) GetItem(index int) LoadableItem {
	actual := *ufcc
	return &actual[index]
}

// Loop function
func (ufcc *UserFileCollectionCollection) Loop(iter func(item LoadableItem) error) error {
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
