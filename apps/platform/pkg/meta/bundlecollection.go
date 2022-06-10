package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type BundleCollection []*Bundle

func (bc *BundleCollection) GetName() string {
	return "uesio/studio.bundle"
}

func (bc *BundleCollection) GetFields() []string {
	return StandardGetFields(&Bundle{})
}

func (bc *BundleCollection) GetItem(index int) loadable.Item {
	return (*bc)[index]
}

func (bc *BundleCollection) NewItem() loadable.Item {
	b := &Bundle{}
	*bc = append(*bc, b)
	return b
}

func (bc *BundleCollection) Loop(iter loadable.GroupIterator) error {
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
