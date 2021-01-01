package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ViewCollection slice
type ViewCollection []View

// GetName function
func (vc *ViewCollection) GetName() string {
	return "views"
}

// GetFields function
func (vc *ViewCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(vc)
}

// NewItem function
func (vc *ViewCollection) NewItem() LoadableItem {
	return &View{}
}

// NewBundleableItem function
func (vc *ViewCollection) NewBundleableItem(key string) (BundleableItem, error) {
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
func (vc *ViewCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (vc *ViewCollection) AddItem(item LoadableItem) {
	*vc = append(*vc, *item.(*View))
}

// GetItem function
func (vc *ViewCollection) GetItem(index int) LoadableItem {
	actual := *vc
	return &actual[index]
}

// Loop function
func (vc *ViewCollection) Loop(iter func(item LoadableItem) error) error {
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
