package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// BundleCollection slice
type BundleCollection []Bundle

// GetName function
func (bc *BundleCollection) GetName() string {
	return "bundles"
}

// GetFields function
func (bc *BundleCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(bc)
}

// GetItem function
func (bc *BundleCollection) GetItem(index int) adapters.LoadableItem {
	return &(*bc)[index]
}

// AddItem function
func (bc *BundleCollection) AddItem(item adapters.LoadableItem) {
	*bc = append(*bc, *item.(*Bundle))
}

// NewItem function
func (bc *BundleCollection) NewItem() adapters.LoadableItem {
	return &Bundle{}
}

// Loop function
func (bc *BundleCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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
