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

func (slc *SelectListCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewSelectList(key)
}

func (slc *SelectListCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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
