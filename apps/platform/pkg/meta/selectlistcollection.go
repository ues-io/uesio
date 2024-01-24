package meta

import (
	"strconv"
)

type SelectListCollection []*SelectList

var SELECTLIST_COLLECTION_NAME = "uesio/studio.selectlist"
var SELECTLIST_FOLDER_NAME = "selectlists"
var SELECTLIST_FIELDS = StandardGetFields(&SelectList{})
var selectListGetTypescriptableItemConditions func() BundleConditions

func init() {
	selectListGetTypescriptableItemConditions = func() BundleConditions {
		return BundleConditions{}
	}
}

// GetTypeGenerationOptions configures how SelectList type definitions should be generated
func (slc *SelectListCollection) GetTypeGenerationOptions() *TypeGenerationOptions {
	return &TypeGenerationOptions{
		GenerateModuleForNamespace:      true,
		GetTypescriptableItemConditions: selectListGetTypescriptableItemConditions,
	}
}

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

func (slc *SelectListCollection) AddItem(item Item) error {
	*slc = append(*slc, item.(*SelectList))
	return nil
}

func (slc *SelectListCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseSelectList(namespace, StandardNameFromPath(path))
}

func (slc *SelectListCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewSelectList(key)
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
