package meta

import (
	"strconv"
)

type BundleDependencyCollection []*BundleDependency

var BUNDLEDEPENDENCY_COLLECTION_NAME = "uesio/studio.bundledependency"
var BUNDLEDEPENDENCY_FIELDS = StandardGetFields(&BundleDependency{})

func (bc *BundleDependencyCollection) GetName() string {
	return BUNDLEDEPENDENCY_COLLECTION_NAME
}

func (bc *BundleDependencyCollection) GetFields() []string {
	return BUNDLEDEPENDENCY_FIELDS
}

func (bc *BundleDependencyCollection) NewItem() Item {
	return &BundleDependency{}
}

func (bc *BundleDependencyCollection) AddItem(item Item) error {
	*bc = append(*bc, item.(*BundleDependency))
	return nil
}

func (bc *BundleDependencyCollection) Loop(iter GroupIterator) error {
	for index, b := range *bc {
		err := iter(b, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (bc *BundleDependencyCollection) Len() int {
	return len(*bc)
}
