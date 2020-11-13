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
func (cvc *ConfigValueCollection) GetFields() []string {
	return []string{"id", "name", "type", "managedby"}
}

// NewItem function
func (cvc *ConfigValueCollection) NewItem(key string) (BundleableItem, error) {
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
func (cvc *ConfigValueCollection) AddItem(item BundleableItem) {
	actual := *cvc
	configValue := item.(*ConfigValue)
	actual = append(actual, *configValue)
	*cvc = actual
}

// UnMarshal function
func (cvc *ConfigValueCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(cvc, data)
}

// Marshal function
func (cvc *ConfigValueCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(cvc)
}

// GetItem function
func (cvc *ConfigValueCollection) GetItem(index int) CollectionableItem {
	actual := *cvc
	return &actual[index]
}

// Loop function
func (cvc *ConfigValueCollection) Loop(iter func(item CollectionableItem) error) error {
	for _, item := range *cvc {
		err := iter(&item)
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
