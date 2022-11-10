package meta

import (
	"strconv"
)

type BundleDependencyCollection []*BundleDependency

func (bc *BundleDependencyCollection) GetName() string {
	return "uesio/studio.bundledependency"
}

func (bc *BundleDependencyCollection) GetFields() []string {
	return StandardGetFields(&BundleDependency{})
}

func (bc *BundleDependencyCollection) GetItem(index int) Item {
	return (*bc)[index]
}

func (bc *BundleDependencyCollection) NewItem() Item {
	return &BundleDependency{}
}

func (bc *BundleDependencyCollection) AddItem(item Item) {
	*bc = append(*bc, item.(*BundleDependency))
}

func (bc *BundleDependencyCollection) Loop(iter GroupIterator) error {
	for index := range *bc {
		err := iter(bc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (bc *BundleDependencyCollection) Len() int {
	return len(*bc)
}

func (bc *BundleDependencyCollection) GetItems() interface{} {
	return *bc
}
