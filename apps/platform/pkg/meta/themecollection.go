package meta

import (
	"strconv"
)

type ThemeCollection []*Theme

var THEME_COLLECTION_NAME = "uesio/studio.theme"
var THEME_FOLDER_NAME = "themes"

func (tc *ThemeCollection) GetName() string {
	return THEME_COLLECTION_NAME
}

func (tc *ThemeCollection) GetBundleFolderName() string {
	return THEME_FOLDER_NAME
}

func (tc *ThemeCollection) GetFields() []string {
	return StandardGetFields(&Theme{})
}

func (tc *ThemeCollection) NewItem() Item {
	return &Theme{}
}

func (tc *ThemeCollection) AddItem(item Item) {
	*tc = append(*tc, item.(*Theme))
}

func (tc *ThemeCollection) GetItemFromPath(path string) BundleableItem {
	return &Theme{Name: StandardNameFromPath(path)}
}

func (tc *ThemeCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (tc *ThemeCollection) GetItem(index int) Item {
	return (*tc)[index]
}

func (tc *ThemeCollection) Loop(iter GroupIterator) error {
	for index := range *tc {
		err := iter(tc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (tc *ThemeCollection) Len() int {
	return len(*tc)
}

func (tc *ThemeCollection) GetItems() interface{} {
	return *tc
}
