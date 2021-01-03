package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// BundleCollection slice
type BundleCollection []Bundle

// GetName function
func (bc *BundleCollection) GetName() string {
	return "bundles"
}

// GetFields function
func (bc *BundleCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(bc)
}

// GetItem function
func (bc *BundleCollection) GetItem(index int) LoadableItem {
	actual := *bc
	return &actual[index]
}

// AddItem function
func (bc *BundleCollection) AddItem(item LoadableItem) {
	*bc = append(*bc, *item.(*Bundle))
}

// NewItem function
func (bc *BundleCollection) NewItem() LoadableItem {
	return &Bundle{}
}

// Loop function
func (bc *BundleCollection) Loop(iter func(item LoadableItem) error) error {
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
