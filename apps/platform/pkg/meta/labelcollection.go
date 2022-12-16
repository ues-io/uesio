package meta

import (
	"strconv"
)

type LabelCollection []*Label

func (lc *LabelCollection) GetName() string {
	return "uesio/studio.label"
}

func (lc *LabelCollection) GetBundleFolderName() string {
	return "labels"
}

func (lc *LabelCollection) GetFields() []string {
	return StandardGetFields(&Label{})
}

func (lc *LabelCollection) NewItem() Item {
	return &Label{}
}

func (lc *LabelCollection) AddItem(item Item) {
	*lc = append(*lc, item.(*Label))
}

func (lc *LabelCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	return &Label{Name: StandardNameFromPath(path)}, true
}

func (lc *LabelCollection) FilterPath(path string, conditions BundleConditions) bool {
	return StandardPathFilter(path)
}

func (lc *LabelCollection) GetItem(index int) Item {
	return (*lc)[index]
}

func (lc *LabelCollection) Loop(iter GroupIterator) error {
	for index := range *lc {
		err := iter(lc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (lc *LabelCollection) Len() int {
	return len(*lc)
}

func (lc *LabelCollection) GetItems() interface{} {
	return *lc
}
