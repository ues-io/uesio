package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/metadata/loadable"
)

// BundleCollection slice
type BundleCollection []Bundle

// GetName function
func (bc *BundleCollection) GetName() string {
	return "bundles"
}

// GetFields function
func (bc *BundleCollection) GetFields() []string {
	return StandardGetFields(bc)
}

// GetItem function
func (bc *BundleCollection) GetItem(index int) loadable.Item {
	return &(*bc)[index]
}

// AddItem function
func (bc *BundleCollection) AddItem(item loadable.Item) {
	*bc = append(*bc, *item.(*Bundle))
}

// NewItem function
func (bc *BundleCollection) NewItem() loadable.Item {
	return &Bundle{}
}

// Loop function
func (bc *BundleCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *bc {
		err := iter(bc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (bc *BundleCollection) Len() int {
	return len(*bc)
}

// GetItems function
func (bc *BundleCollection) GetItems() interface{} {
	return bc
}

// Slice function
func (bc *BundleCollection) Slice(start int, end int) {

}
