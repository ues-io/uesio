package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// CollectionCollection slice
type CollectionCollection []Collection

// GetName function
func (cc *CollectionCollection) GetName() string {
	return "studio.collections"
}

// GetFields function
func (cc *CollectionCollection) GetFields() []string {
	return StandardGetFields(&Collection{})
}

// NewBundleableItemWithKey function
func (cc *CollectionCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	collection, err := NewCollection(key)
	if err != nil {
		return nil, err
	}
	*cc = append(*cc, *collection)
	return &(*cc)[len(*cc)-1], nil
}

// GetKeyFromPath function
func (cc *CollectionCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// NewItem function
func (cc *CollectionCollection) NewItem() loadable.Item {
	*cc = append(*cc, Collection{})
	return &(*cc)[len(*cc)-1]
}

// GetItem function
func (cc *CollectionCollection) GetItem(index int) loadable.Item {
	return &(*cc)[index]
}

// Loop function
func (cc *CollectionCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *cc {
		err := iter(cc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (cc *CollectionCollection) Len() int {
	return len(*cc)
}

// GetItems function
func (cc *CollectionCollection) GetItems() interface{} {
	return *cc
}

// Slice function
func (cc *CollectionCollection) Slice(start int, end int) {

}
