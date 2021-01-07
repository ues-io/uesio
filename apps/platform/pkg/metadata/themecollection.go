package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ThemeCollection slice
type ThemeCollection []Theme

// GetName function
func (tc *ThemeCollection) GetName() string {
	return "themes"
}

// GetFields function
func (tc *ThemeCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(tc)
}

// NewItem function
func (tc *ThemeCollection) NewItem() LoadableItem {
	return &Theme{}
}

// NewBundleableItem function
func (tc *ThemeCollection) NewBundleableItem() BundleableItem {
	return &Theme{}
}

// NewBundleableItem function
func (tc *ThemeCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Theme Key: " + key)
	}
	return &Theme{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyPrefix function
func (tc *ThemeCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (tc *ThemeCollection) AddItem(item LoadableItem) {
	*tc = append(*tc, *item.(*Theme))
}

// GetItem function
func (tc *ThemeCollection) GetItem(index int) LoadableItem {
	actual := *tc
	return &actual[index]
}

// Loop function
func (tc *ThemeCollection) Loop(iter func(item LoadableItem) error) error {
	for index := range *tc {
		err := iter(tc.GetItem(index))
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
