package meta

import (
	"strconv"
)

type BundleCollection []*Bundle

var BUNDLE_COLLECTION_NAME = "uesio/studio.bundle"

func (bc *BundleCollection) GetName() string {
	return BUNDLE_COLLECTION_NAME
}

func (bc *BundleCollection) GetFields() []string {
	return StandardGetFields(&Bundle{})
}

func (bc *BundleCollection) GetItem(index int) Item {
	return (*bc)[index]
}

func (bc *BundleCollection) NewItem() Item {
	return &Bundle{}
}

func (bc *BundleCollection) AddItem(item Item) {
	*bc = append(*bc, item.(*Bundle))
}

func (bc *BundleCollection) Loop(iter GroupIterator) error {
	for index := range *bc {
		err := iter(bc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (bc *BundleCollection) Len() int {
	return len(*bc)
}

func (bc *BundleCollection) GetItems() interface{} {
	return *bc
}
