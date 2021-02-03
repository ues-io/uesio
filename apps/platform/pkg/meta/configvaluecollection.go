package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ConfigValueCollection slice
type ConfigValueCollection []ConfigValue

// GetName function
func (cvc *ConfigValueCollection) GetName() string {
	return "configvalues"
}

// GetFields function
func (cvc *ConfigValueCollection) GetFields() []string {
	return StandardGetFields(&ConfigValue{})
}

// NewItem function
func (cvc *ConfigValueCollection) NewItem() loadable.Item {
	return &ConfigValue{}
}

// NewBundleableItem function
func (bc *ConfigValueCollection) NewBundleableItem() BundleableItem {
	return &ConfigValue{}
}

// NewBundleableItem function
func (cvc *ConfigValueCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewConfigValue(key)
}

// GetKeyFromPath function
func (cvc *ConfigValueCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, conditions)
}

// AddItem function
func (cvc *ConfigValueCollection) AddItem(item loadable.Item) {
	*cvc = append(*cvc, *item.(*ConfigValue))
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
	return cvc
}

// Slice function
func (cvc *ConfigValueCollection) Slice(start int, end int) {

}
