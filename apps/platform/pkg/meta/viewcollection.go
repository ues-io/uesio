package meta

import (
	"strconv"
)

type ViewCollection []*View

var VIEW_COLLECTION_NAME = "uesio/studio.view"
var VIEW_FOLDER_NAME = "views"

func (vc *ViewCollection) GetName() string {
	return VIEW_COLLECTION_NAME
}

func (vc *ViewCollection) GetBundleFolderName() string {
	return VIEW_FOLDER_NAME
}

func (vc *ViewCollection) GetFields() []string {
	return StandardGetFields(&View{})
}

func (vc *ViewCollection) NewItem() Item {
	return &View{}
}

func (vc *ViewCollection) AddItem(item Item) {
	*vc = append(*vc, item.(*View))
}

func (vc *ViewCollection) GetItemFromPath(path string) BundleableItem {
	return &View{Name: StandardNameFromPath(path)}
}

func (vc *ViewCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (vc *ViewCollection) GetItem(index int) Item {
	return (*vc)[index]
}

func (vc *ViewCollection) Loop(iter GroupIterator) error {
	for index := range *vc {
		err := iter(vc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (vc *ViewCollection) Len() int {
	return len(*vc)
}

func (vc *ViewCollection) GetItems() interface{} {
	return *vc
}
