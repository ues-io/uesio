package meta

import (
	"strconv"
)

type UtilityCollection []*Utility

var UTILITY_COLLECTION_NAME = "uesio/studio.utility"
var UTILITY_FOLDER_NAME = "utilities"

func (uc *UtilityCollection) GetName() string {
	return UTILITY_COLLECTION_NAME
}

func (uc *UtilityCollection) GetBundleFolderName() string {
	return UTILITY_FOLDER_NAME
}

func (uc *UtilityCollection) GetFields() []string {
	return StandardGetFields(&Utility{})
}

func (uc *UtilityCollection) NewItem() Item {
	return &Utility{}
}

func (uc *UtilityCollection) AddItem(item Item) {
	*uc = append(*uc, item.(*Utility))
}

func (uc *UtilityCollection) GetItemFromPath(path string) BundleableItem {
	return &Utility{Name: StandardNameFromPath(path)}
}

func (uc *UtilityCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (uc *UtilityCollection) GetItem(index int) Item {
	return (*uc)[index]
}

func (uc *UtilityCollection) Loop(iter GroupIterator) error {
	for index := range *uc {
		err := iter(uc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (uc *UtilityCollection) Len() int {
	return len(*uc)
}

func (uc *UtilityCollection) GetItems() interface{} {
	return *uc
}
