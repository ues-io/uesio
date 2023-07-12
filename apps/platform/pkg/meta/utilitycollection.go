package meta

import (
	"strconv"
)

type UtilityCollection []*Utility

var UTILITY_COLLECTION_NAME = "uesio/studio.utility"
var UTILITY_FOLDER_NAME = "utilities"
var UTILITY_FIELDS = StandardGetFields(&Utility{})

func (uc *UtilityCollection) GetName() string {
	return UTILITY_COLLECTION_NAME
}

func (uc *UtilityCollection) GetBundleFolderName() string {
	return UTILITY_FOLDER_NAME
}

func (uc *UtilityCollection) GetFields() []string {
	return UTILITY_FIELDS
}

func (uc *UtilityCollection) NewItem() Item {
	return &Utility{}
}

func (uc *UtilityCollection) AddItem(item Item) error {
	*uc = append(*uc, item.(*Utility))
	return nil
}

func (uc *UtilityCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseUtility(namespace, StandardNameFromPath(path))
}

func (uc *UtilityCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewUtility(key)
}

func (uc *UtilityCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (uc *UtilityCollection) Loop(iter GroupIterator) error {
	for index, u := range *uc {
		err := iter(u, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (uc *UtilityCollection) Len() int {
	return len(*uc)
}
