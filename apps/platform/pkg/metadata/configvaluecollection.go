package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// ConfigValueCollection slice
type ConfigValueCollection []ConfigValue

// GetName function
func (cvc *ConfigValueCollection) GetName() string {
	return "configvalues"
}

// GetFields function
func (cvc *ConfigValueCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(cvc)
}

// NewItem function
func (cvc *ConfigValueCollection) NewItem() LoadableItem {
	return &ConfigValue{}
}

// NewBundleableItem function
func (cvc *ConfigValueCollection) NewBundleableItem(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid ComponentPack Key: " + key)
	}
	return &ConfigValue{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyPrefix function
func (cvc *ConfigValueCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (cvc *ConfigValueCollection) AddItem(item LoadableItem) {
	*cvc = append(*cvc, *item.(*ConfigValue))
}

// GetItem function
func (cvc *ConfigValueCollection) GetItem(index int) LoadableItem {
	actual := *cvc
	return &actual[index]
}

// Loop function
func (cvc *ConfigValueCollection) Loop(iter func(item LoadableItem) error) error {
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
