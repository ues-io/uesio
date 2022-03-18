package meta

import (
	"errors"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// SelectListCollection slice
type SelectListCollection []SelectList

// GetName function
func (slc *SelectListCollection) GetName() string {
	return "uesio/studio.selectlists"
}

// GetFields function
func (slc *SelectListCollection) GetFields() []string {
	return StandardGetFields(&SelectList{})
}

// NewItem function
func (slc *SelectListCollection) NewItem() loadable.Item {
	*slc = append(*slc, SelectList{})
	return &(*slc)[len(*slc)-1]
}

// NewBundleableItemWithKey function
func (slc *SelectListCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid SelectList Key: " + key)
	}
	*slc = append(*slc, SelectList{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	})
	return &(*slc)[len(*slc)-1], nil
}

// GetKeyFromPath function
func (slc *SelectListCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

// GetItem function
func (slc *SelectListCollection) GetItem(index int) loadable.Item {
	return &(*slc)[index]
}

// Loop function
func (slc *SelectListCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *slc {
		err := iter(slc.GetItem(index), strconv.Itoa(index))
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
	return *slc
}
