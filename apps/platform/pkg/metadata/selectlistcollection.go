package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// SelectListCollection slice
type SelectListCollection []SelectList

// GetName function
func (slc *SelectListCollection) GetName() string {
	return "selectlists"
}

// GetFields function
func (slc *SelectListCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(slc)
}

// NewItem function
func (slc *SelectListCollection) NewItem() LoadableItem {
	return &SelectList{}
}

// NewBundleableItem function
func (slc *SelectListCollection) NewBundleableItem(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid SelectList Key: " + key)
	}
	return &SelectList{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyPrefix function
func (slc *SelectListCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (slc *SelectListCollection) AddItem(item LoadableItem) {
	*slc = append(*slc, *item.(*SelectList))
}

// GetItem function
func (slc *SelectListCollection) GetItem(index int) LoadableItem {
	actual := *slc
	return &actual[index]
}

// Loop function
func (slc *SelectListCollection) Loop(iter func(item LoadableItem) error) error {
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
