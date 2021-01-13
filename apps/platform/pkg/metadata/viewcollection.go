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

// GetKeyPrefix function
func (vc *ViewCollection) GetKeyPrefix(conditions BundleConditions) string {
	return ""
}

// AddItem function
func (vc *ViewCollection) AddItem(item adapters.LoadableItem) {
	*vc = append(*vc, *item.(*View))
}

// GetItem function
func (vc *ViewCollection) GetItem(index int) adapters.LoadableItem {
	actual := *vc
	return &actual[index]
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

// Sort function
func (vc *ViewCollection) Sort(order []adapters.LoadRequestOrder, collectionMetadata *adapters.CollectionMetadata) {
	println("Sort")
}
