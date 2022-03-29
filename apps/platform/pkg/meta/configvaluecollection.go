package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ConfigValueCollection slice
type ConfigValueCollection []ConfigValue

// GetName function
func (cvc *ConfigValueCollection) GetName() string {
	return "uesio/studio.configvalues"
}

// GetBundleFolderName function
func (cvc *ConfigValueCollection) GetBundleFolderName() string {
	return "configvalues"
}

// GetFields function
func (cvc *ConfigValueCollection) GetFields() []string {
	return StandardGetFields(&ConfigValue{})
}

// NewItem function
func (cvc *ConfigValueCollection) NewItem() loadable.Item {
	*cvc = append(*cvc, ConfigValue{})
	return &(*cvc)[len(*cvc)-1]
}

// NewBundleableItemWithKey function
func (cvc *ConfigValueCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	cv, err := NewConfigValue(key)
	if err != nil {
		return nil, err
	}
	*cvc = append(*cvc, *cv)
	return &(*cvc)[len(*cvc)-1], nil
}

// GetKeyFromPath function
func (cvc *ConfigValueCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

// GetItem function
func (cvc *ConfigValueCollection) GetItem(index int) loadable.Item {
	return &(*cvc)[index]
}

// Loop function
func (cvc *ConfigValueCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *cvc {
		err := iter(cvc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (cvc *ConfigValueCollection) Len() int {
	return len(*cvc)
}

// GetItems function
func (cvc *ConfigValueCollection) GetItems() interface{} {
	return *cvc
}
