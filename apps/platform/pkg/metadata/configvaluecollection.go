package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// ConfigValueCollection slice
type ConfigValueCollection []ConfigValue

// GetName function
func (cvc *ConfigValueCollection) GetName() string {
	return "configvalues"
}

// GetFields function
func (cvc *ConfigValueCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(cvc)
}

// NewItem function
func (cvc *ConfigValueCollection) NewItem() adapters.LoadableItem {
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

// GetKeyPrefix function
func (cvc *ConfigValueCollection) GetKeyPrefix(conditions BundleConditions) string {
	return ""
}

// AddItem function
func (cvc *ConfigValueCollection) AddItem(item adapters.LoadableItem) {
	*cvc = append(*cvc, *item.(*ConfigValue))
}

// GetItem function
func (cvc *ConfigValueCollection) GetItem(index int) adapters.LoadableItem {
	actual := *cvc
	return &actual[index]
}

// Loop function
func (cvc *ConfigValueCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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
