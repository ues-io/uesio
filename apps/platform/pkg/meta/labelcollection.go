package meta

import (
	"errors"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// LabelCollection slice
type LabelCollection []Label

// GetName function
func (lc *LabelCollection) GetName() string {
	return "uesio/studio.label"
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
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid Label Key: " + key)
	}
	*lc = append(*lc, Label{
		Namespace: namespace,
		Name:      name,
	})
	return &(*lc)[len(*lc)-1], nil
}

// GetKeyFromPath function
func (lc *LabelCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

// GetItem function
func (lc *LabelCollection) GetItem(index int) loadable.Item {
	return &(*lc)[index]
}

// Loop function
func (lc *LabelCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *lc {
		err := iter(lc.GetItem(index), strconv.Itoa(index))
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
