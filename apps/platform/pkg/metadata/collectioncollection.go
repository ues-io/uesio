package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// CollectionCollection slice
type CollectionCollection []Collection

// GetName function
func (cc *CollectionCollection) GetName() string {
	return "collections"
}

// GetFields function
func (cc *CollectionCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(cc)
}

// NewBundleableItem function
func (cc *CollectionCollection) NewBundleableItem() BundleableItem {
	return &Collection{}
}

// NewBundleableItem function
func (cc *CollectionCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewCollection(key)
}

// GetKeyPrefix function
func (cc *CollectionCollection) GetKeyPrefix(conditions BundleConditions) string {
	return ""
}

// AddItem function
func (cc *CollectionCollection) AddItem(item adapters.LoadableItem) {
	*cc = append(*cc, *item.(*Collection))
}

// NewItem function
func (cc *CollectionCollection) NewItem() adapters.LoadableItem {
	return &Collection{}
}

// GetItem function
func (cc *CollectionCollection) GetItem(index int) adapters.LoadableItem {
	actual := *cc
	return &actual[index]
}

// Loop function
func (cc *CollectionCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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
	return cc
}
