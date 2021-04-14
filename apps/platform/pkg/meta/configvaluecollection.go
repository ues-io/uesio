package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ConfigValueCollection slice
type ConfigValueCollection []ConfigValue

// GetName function
func (cvc *ConfigValueCollection) GetName() string {
	return "studio.configvalues"
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
func (cvc *ConfigValueCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// GetItem function
func (cvc *ConfigValueCollection) GetItem(index int) loadable.Item {
	return &(*cvc)[index]
}

// Loop function
func (cvc *ConfigValueCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *cvc {
		err := iter(cvc.GetItem(index))
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

// Slice function
func (cvc *ConfigValueCollection) Slice(start int, end int) {

}
func (bc *ConfigValueCollection) Filter(iter func(item loadable.Item) (bool, error)) error {
	return nil
}
