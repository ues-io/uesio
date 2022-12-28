package meta

import (
	"strconv"
)

type BundleCollection []*Bundle

var BUNDLE_COLLECTION_NAME = "uesio/studio.bundle"
var BUNDLE_FIELDS = StandardGetFields(&Bundle{})

func (bc *BundleCollection) GetName() string {
	return BUNDLE_COLLECTION_NAME
}

func (bc *BundleCollection) GetFields() []string {
	return BUNDLE_FIELDS
}

func (bc *BundleCollection) NewItem() Item {
	return &Bundle{}
}

func (bc *BundleCollection) AddItem(item Item) {
	*bc = append(*bc, item.(*Bundle))
}

func (bc *BundleCollection) Loop(iter GroupIterator) error {
	for index, b := range *bc {
		err := iter(b, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (bc *BundleCollection) Len() int {
	return len(*bc)
}
