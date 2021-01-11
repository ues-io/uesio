package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// ComponentPackCollection slice
type ComponentPackCollection []ComponentPack

// GetName function
func (cpc *ComponentPackCollection) GetName() string {
	return "componentpacks"
}

// GetFields function
func (cpc *ComponentPackCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(cpc)
}

// NewItem function
func (cpc *ComponentPackCollection) NewItem() adapters.LoadableItem {
	return &ComponentPack{}
}

// NewBundleableItem function
func (cpc *ComponentPackCollection) NewBundleableItem() BundleableItem {
	return &ComponentPack{}
}

// NewBundleableItem function
func (cpc *ComponentPackCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid ComponentPack Key: " + key)
	}
	return &ComponentPack{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyPrefix function
func (cpc *ComponentPackCollection) GetKeyPrefix(conditions BundleConditions) string {
	return ""
}

// AddItem function
func (cpc *ComponentPackCollection) AddItem(item adapters.LoadableItem) {
	*cpc = append(*cpc, *item.(*ComponentPack))
}

// GetItem function
func (cpc *ComponentPackCollection) GetItem(index int) adapters.LoadableItem {
	actual := *cpc
	return &actual[index]
}

// Loop function
func (cpc *ComponentPackCollection) Loop(iter func(item adapters.LoadableItem) error) error {
	for index := range *cpc {
		err := iter(cpc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (cpc *ComponentPackCollection) Len() int {
	return len(*cpc)
}
