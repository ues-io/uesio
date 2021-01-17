package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// SelectListCollection slice
type SelectListCollection []SelectList

// GetName function
func (slc *SelectListCollection) GetName() string {
	return "selectlists"
}

// GetFields function
func (slc *SelectListCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(slc)
}

// NewItem function
func (slc *SelectListCollection) NewItem() adapters.LoadableItem {
	return &SelectList{}
}

// NewBundleableItem function
func (slc *SelectListCollection) NewBundleableItem() BundleableItem {
	return &SelectList{}
}

// NewBundleableItem function
func (slc *SelectListCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid SelectList Key: " + key)
	}
	return &SelectList{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyFromPath function
func (slc *SelectListCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// AddItem function
func (slc *SelectListCollection) AddItem(item adapters.LoadableItem) {
	*slc = append(*slc, *item.(*SelectList))
}

// GetItem function
func (slc *SelectListCollection) GetItem(index int) adapters.LoadableItem {
	actual := *slc
	return &actual[index]
}

// Loop function
func (slc *SelectListCollection) Loop(iter func(item adapters.LoadableItem) error) error {
	for index := range *slc {
		err := iter(slc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (slc *SelectListCollection) Len() int {
	return len(*slc)
}

// GetItems function
func (slc *SelectListCollection) GetItems() interface{} {
	return slc
}
