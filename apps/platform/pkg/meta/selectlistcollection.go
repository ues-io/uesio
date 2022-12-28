package meta

import (
	"strconv"
)

type SelectListCollection []*SelectList

var SELECTLIST_COLLECTION_NAME = "uesio/studio.selectlist"
var SELECTLIST_FOLDER_NAME = "selectlists"
var SELECTLIST_FIELDS = StandardGetFields(&SelectList{})

func (slc *SelectListCollection) GetName() string {
	return SELECTLIST_COLLECTION_NAME
}

func (slc *SelectListCollection) GetBundleFolderName() string {
	return SELECTLIST_FOLDER_NAME
}

func (slc *SelectListCollection) GetFields() []string {
	return SELECTLIST_FIELDS
}

func (slc *SelectListCollection) NewItem() Item {
	return &SelectList{}
}

func (slc *SelectListCollection) AddItem(item Item) {
	*slc = append(*slc, item.(*SelectList))
}

func (slc *SelectListCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseSelectList(namespace, StandardNameFromPath(path))
}

func (slc *SelectListCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (slc *SelectListCollection) Loop(iter GroupIterator) error {
	for index, sl := range *slc {
		err := iter(sl, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (slc *SelectListCollection) Len() int {
	return len(*slc)
}
