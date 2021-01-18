package metadata

import (
	"errors"
	"os"
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

// GetKeyFromPath function
func (cpc *ComponentPackCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	if len(conditions) > 0 {
		return "", errors.New("Conditions not allowed for component packs")
	}
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 2 || parts[1] != "pack.yaml" {
		// Ignore this file
		return "", nil
	}
	return parts[0], nil
}

// AddItem function
func (cpc *ComponentPackCollection) AddItem(item adapters.LoadableItem) {
	*cpc = append(*cpc, *item.(*ComponentPack))
}

// GetItem function
func (cpc *ComponentPackCollection) GetItem(index int) adapters.LoadableItem {
	return &(*cpc)[index]
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

// GetItems function
func (cpc *ComponentPackCollection) GetItems() interface{} {
	return cpc
}
