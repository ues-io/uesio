package meta

import (
	"strconv"
)

type UtilityCollection []*Utility

func (uc *UtilityCollection) GetName() string {
	return "uesio/studio.utility"
}

func (uc *UtilityCollection) GetBundleFolderName() string {
	return "utilities"
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

func (uc *UtilityCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	return &Utility{Name: StandardNameFromPath(path)}, true
}

func (uc *UtilityCollection) FilterPath(path string, conditions BundleConditions) bool {
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
