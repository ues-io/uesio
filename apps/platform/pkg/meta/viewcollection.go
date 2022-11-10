package meta

import (
	"strconv"
)

type ViewCollection []*View

func (vc *ViewCollection) GetName() string {
	return "uesio/studio.view"
}

func (vc *ViewCollection) GetBundleFolderName() string {
	return "views"
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

func (vc *ViewCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewView(key)
}

func (vc *ViewCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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
