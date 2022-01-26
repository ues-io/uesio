package meta

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ThemeCollection slice
type ThemeCollection []Theme

// GetName function
func (tc *ThemeCollection) GetName() string {
	return "studio.themes"
}

// GetFields function
func (tc *ThemeCollection) GetFields() []string {
	return StandardGetFields(&Theme{})
}

// NewItem function
func (tc *ThemeCollection) NewItem() loadable.Item {
	*tc = append(*tc, Theme{})
	return &(*tc)[len(*tc)-1]
}

// NewBundleableItemWithKey function
func (tc *ThemeCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Theme Key: " + key)
	}
	*tc = append(*tc, Theme{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	})
	return &(*tc)[len(*tc)-1], nil
}

// GetKeyFromPath function
func (tc *ThemeCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// GetItem function
func (tc *ThemeCollection) GetItem(index int) loadable.Item {
	return &(*tc)[index]
}

// Loop function
func (tc *ThemeCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *tc {
		err := iter(tc.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (tc *ThemeCollection) Len() int {
	return len(*tc)
}

// GetItems function
func (tc *ThemeCollection) GetItems() interface{} {
	return *tc
}
