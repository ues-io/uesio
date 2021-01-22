package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// BundleDependencyCollection slice
type BundleDependencyCollection []BundleDependency

// GetName function
func (bc *BundleDependencyCollection) GetName() string {
	return "bundledependencies"
}

// GetFields function
func (bc *BundleDependencyCollection) GetFields() []string {
	return StandardGetFields(bc)
}

// GetItem function
func (bc *BundleDependencyCollection) GetItem(index int) loadable.Item {
	return &(*bc)[index]
}

// AddItem function
func (bc *BundleDependencyCollection) AddItem(item loadable.Item) {
	*bc = append(*bc, *item.(*BundleDependency))
}

// NewItem function
func (bc *BundleDependencyCollection) NewItem() loadable.Item {
	return &BundleDependency{}
}

// Loop function
func (bc *BundleDependencyCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *bc {
		err := iter(bc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (bc *BundleDependencyCollection) Len() int {
	return len(*bc)
}

// GetItems function
func (bc *BundleDependencyCollection) GetItems() interface{} {
	return bc
}

// Slice function
func (bc *BundleDependencyCollection) Slice(start int, end int) {

}
