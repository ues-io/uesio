package meta

import (
	"errors"
	"os"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ComponentPackCollection slice
type ComponentPackCollection []ComponentPack

// GetName function
func (cpc *ComponentPackCollection) GetName() string {
	return "uesio/studio.componentpack"
}

// GetBundleFolderName function
func (cpc *ComponentPackCollection) GetBundleFolderName() string {
	return "componentpacks"
}

// GetFields function
func (cpc *ComponentPackCollection) GetFields() []string {
	return StandardGetFields(&ComponentPack{})
}

// NewItem function
func (cpc *ComponentPackCollection) NewItem() loadable.Item {
	*cpc = append(*cpc, ComponentPack{})
	return &(*cpc)[len(*cpc)-1]
}

// NewBundleableItemWithKey function
func (cpc *ComponentPackCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid ComponentPack Key: " + key)
	}
	*cpc = append(*cpc, ComponentPack{
		Namespace: namespace,
		Name:      name,
	})
	return &(*cpc)[len(*cpc)-1], nil
}

// GetKeyFromPath function
func (cpc *ComponentPackCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	if len(conditions) > 0 {
		return "", errors.New("Conditions not allowed for component packs")
	}
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 2 || parts[1] != "pack.yaml" {
		// Ignore this file
		return "", nil
	}
	return namespace + "." + parts[0], nil
}

// GetItem function
func (cpc *ComponentPackCollection) GetItem(index int) loadable.Item {
	return &(*cpc)[index]
}

// Loop function
func (cpc *ComponentPackCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *cpc {
		err := iter(cpc.GetItem(index), strconv.Itoa(index))
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
	return *cpc
}
