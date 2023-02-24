package meta

import (
	"strconv"
)

type ThemeCollection []*Theme

var THEME_COLLECTION_NAME = "uesio/studio.theme"
var THEME_FOLDER_NAME = "themes"
var THEME_FIELDS = StandardGetFields(&Theme{})

func (tc *ThemeCollection) GetName() string {
	return THEME_COLLECTION_NAME
}

func (tc *ThemeCollection) GetBundleFolderName() string {
	return THEME_FOLDER_NAME
}

func (tc *ThemeCollection) GetFields() []string {
	return THEME_FIELDS
}

func (tc *ThemeCollection) NewItem() Item {
	return &Theme{}
}

func (tc *ThemeCollection) AddItem(item Item) error {
	*tc = append(*tc, item.(*Theme))
	return nil
}

func (tc *ThemeCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseTheme(namespace, StandardNameFromPath(path))
}

func (tc *ThemeCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (tc *ThemeCollection) Loop(iter GroupIterator) error {
	for index, t := range *tc {
		err := iter(t, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (tc *ThemeCollection) Len() int {
	return len(*tc)
}
