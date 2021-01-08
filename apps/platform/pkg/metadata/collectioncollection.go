package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// CollectionCollection slice
type CollectionCollection []Collection

// GetName function
func (cc *CollectionCollection) GetName() string {
	return "collections"
}

// GetFields function
func (cc *CollectionCollection) GetFields() []reqs.LoadRequestField {
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
func (cc *CollectionCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (cc *CollectionCollection) AddItem(item LoadableItem) {
	*cc = append(*cc, *item.(*Collection))
}

// NewItem function
func (cc *CollectionCollection) NewItem() LoadableItem {
	return &Collection{}
}

// GetItem function
func (cc *CollectionCollection) GetItem(index int) LoadableItem {
	actual := *cc
	return &actual[index]
}

// Loop function
func (cc *CollectionCollection) Loop(iter func(item LoadableItem) error) error {
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
