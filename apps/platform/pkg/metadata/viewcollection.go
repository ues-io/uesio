package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// ViewCollection slice
type ViewCollection []View

// GetName function
func (vc *ViewCollection) GetName() string {
	return "views"
}

// GetFields function
func (vc *ViewCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(vc)
}

// NewItem function
func (vc *ViewCollection) NewItem() adapters.LoadableItem {
	return &View{}
}

// NewBundleableItem function
func (vc *ViewCollection) NewBundleableItem() BundleableItem {
	return &View{}
}

// NewBundleableItem function
func (vc *ViewCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid View Key: " + key)
	}
	return &View{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyFromPath function
func (vc *ViewCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// AddItem function
func (vc *ViewCollection) AddItem(item adapters.LoadableItem) {
	*vc = append(*vc, *item.(*View))
}

// GetItem function
func (vc *ViewCollection) GetItem(index int) adapters.LoadableItem {
	return &(*vc)[index]
}

// Loop function
func (vc *ViewCollection) Loop(iter func(item adapters.LoadableItem) error) error {
	for index := range *vc {
		err := iter(vc.GetItem(index))
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
	return vc
}

// Slice function
func (vc *ViewCollection) Slice(start int, end int) error {
	return nil
}
