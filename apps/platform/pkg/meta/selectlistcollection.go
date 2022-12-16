package meta

import (
	"strconv"
)

type SelectListCollection []*SelectList

func (slc *SelectListCollection) GetName() string {
	return "uesio/studio.selectlist"
}

func (slc *SelectListCollection) GetBundleFolderName() string {
	return "selectlists"
}

func (slc *SelectListCollection) GetFields() []string {
	return StandardGetFields(&SelectList{})
}

func (slc *SelectListCollection) NewItem() Item {
	return &SelectList{}
}

func (slc *SelectListCollection) AddItem(item Item) {
	*slc = append(*slc, item.(*SelectList))
}

func (slc *SelectListCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	return &SelectList{Name: StandardNameFromPath(path)}, true
}

func (slc *SelectListCollection) FilterPath(path string, conditions BundleConditions) bool {
	return StandardPathFilter(path)
}

func (slc *SelectListCollection) GetItem(index int) Item {
	return (*slc)[index]
}

func (slc *SelectListCollection) Loop(iter GroupIterator) error {
	for index := range *slc {
		err := iter(slc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (slc *SelectListCollection) Len() int {
	return len(*slc)
}

func (slc *SelectListCollection) GetItems() interface{} {
	return *slc
}
