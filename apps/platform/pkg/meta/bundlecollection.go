package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// BundleCollection slice
type BundleCollection []Bundle

// GetName function
func (bc *BundleCollection) GetName() string {
	return "uesio/studio.bundle"
}

// GetFields function
func (bc *BundleCollection) GetFields() []string {
	return StandardGetFields(&Bundle{})
}

// GetItem function
func (bc *BundleCollection) GetItem(index int) loadable.Item {
	return &(*bc)[index]
}

// NewItem function
func (bc *BundleCollection) NewItem() loadable.Item {
	*bc = append(*bc, Bundle{})
	return &(*bc)[len(*bc)-1]
}

// Loop function
func (bc *BundleCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *bc {
		err := iter(bc.GetItem(index), strconv.Itoa(index))
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
	return *bc
}
