package meta

import (
	"strconv"
)

type ThemeCollection []*Theme

func (tc *ThemeCollection) GetName() string {
	return "uesio/studio.theme"
}

func (tc *ThemeCollection) GetBundleFolderName() string {
	return "themes"
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

func (tc *ThemeCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	return &Theme{Name: StandardNameFromPath(path)}, true
}

func (tc *ThemeCollection) FilterPath(path string, conditions BundleConditions) bool {
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
