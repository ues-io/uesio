package meta

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// LabelCollection slice
type LabelCollection []Label

// GetName function
func (lc *LabelCollection) GetName() string {
	return "studio.labels"
}

// GetFields function
func (lc *LabelCollection) GetFields() []string {
	return StandardGetFields(&Label{})
}

// NewItem function
func (lc *LabelCollection) NewItem() loadable.Item {
	*lc = append(*lc, Label{})
	return &(*lc)[len(*lc)-1]
}

// NewBundleableItemWithKey function
func (lc *LabelCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Label Key: " + key)
	}
	*lc = append(*lc, Label{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	})
	return &(*lc)[len(*lc)-1], nil
}

// GetKeyFromPath function
func (lc *LabelCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// GetItem function
func (lc *LabelCollection) GetItem(index int) loadable.Item {
	return &(*lc)[index]
}

// Loop function
func (lc *LabelCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *lc {
		err := iter(lc.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (lc *LabelCollection) Len() int {
	return len(*lc)
}

// GetItems function
func (lc *LabelCollection) GetItems() interface{} {
	return *lc
}
