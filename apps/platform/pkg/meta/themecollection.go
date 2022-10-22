package meta

import (
	"errors"
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
	t := &Theme{}
	*tc = append(*tc, t)
	return t
}

func (tc *ThemeCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid Theme Key: " + key)
	}
	t := &Theme{
		Namespace: namespace,
		Name:      name,
	}
	*tc = append(*tc, t)
	return t, nil
}

func (tc *ThemeCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
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
