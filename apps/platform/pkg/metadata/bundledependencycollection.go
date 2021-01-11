package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// BundleDependencyCollection slice
type BundleDependencyCollection []BundleDependency

// GetName function
func (bc *BundleDependencyCollection) GetName() string {
	return "bundledependencies"
}

// GetFields function
func (bc *BundleDependencyCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(bc)
}

// GetItem function
func (bc *BundleDependencyCollection) GetItem(index int) adapters.LoadableItem {
	actual := *bc
	return &actual[index]
}

// AddItem function
func (bc *BundleDependencyCollection) AddItem(item adapters.LoadableItem) {
	*bc = append(*bc, *item.(*BundleDependency))
}

// NewItem function
func (bc *BundleDependencyCollection) NewItem() adapters.LoadableItem {
	return &BundleDependency{}
}

// Loop function
func (bc *BundleDependencyCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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
