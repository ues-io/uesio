package meta

import (
	"strconv"
)

type ViewCollection []*View

var VIEW_COLLECTION_NAME = "uesio/studio.view"
var VIEW_FOLDER_NAME = "views"
var VIEW_FIELDS = StandardGetFields(&View{})

func (vc *ViewCollection) GetName() string {
	return VIEW_COLLECTION_NAME
}

func (vc *ViewCollection) GetBundleFolderName() string {
	return VIEW_FOLDER_NAME
}

func (vc *ViewCollection) GetFields() []string {
	return VIEW_FIELDS
}

func (vc *ViewCollection) NewItem() Item {
	return &View{}
}

func (vc *ViewCollection) AddItem(item Item) {
	*vc = append(*vc, item.(*View))
}

func (vc *ViewCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseView(namespace, StandardNameFromPath(path))
}

func (vc *ViewCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (vc *ViewCollection) Loop(iter GroupIterator) error {
	for index, v := range *vc {
		err := iter(v, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (vc *ViewCollection) Len() int {
	return len(*vc)
}
