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
	return StandardGetFields(&BundleDependency{})
}

// GetItem function
func (bc *BundleDependencyCollection) GetItem(index int) loadable.Item {
	return &(*bc)[index]
}

// NewItem function
func (bc *BundleDependencyCollection) NewItem() loadable.Item {
	*bc = append(*bc, BundleDependency{})
	return &(*bc)[len(*bc)-1]
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
