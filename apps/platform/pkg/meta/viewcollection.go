package meta

import (
	"errors"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ViewCollection slice
type ViewCollection []View

// GetName function
func (vc *ViewCollection) GetName() string {
	return "uesio/studio.view"
}

// GetBundleFolderName function
func (vc *ViewCollection) GetBundleFolderName() string {
	return "views"
}

// GetFields function
func (vc *ViewCollection) GetFields() []string {
	return StandardGetFields(&View{})
}

// NewItem function
func (vc *ViewCollection) NewItem() loadable.Item {
	*vc = append(*vc, View{})
	return &(*vc)[len(*vc)-1]
}

// NewBundleableItemWithKey function
func (vc *ViewCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid View Key: " + key)
	}
	*vc = append(*vc, View{
		Namespace: namespace,
		Name:      name,
	})
	return &(*vc)[len(*vc)-1], nil
}

// GetKeyFromPath function
func (vc *ViewCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

// GetItem function
func (vc *ViewCollection) GetItem(index int) loadable.Item {
	return &(*vc)[index]
}

// Loop function
func (vc *ViewCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *vc {
		err := iter(vc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (vc *ViewCollection) Len() int {
	return len(*vc)
}

// GetItems function
func (vc *ViewCollection) GetItems() interface{} {
	return *vc
}
