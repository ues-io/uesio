package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// AuthMethodCollection slice
type AuthMethodCollection []AuthMethod

// GetName function
func (amc *AuthMethodCollection) GetName() string {
	return "uesio/studio.authmethod"
}

// GetFields function
func (amc *AuthMethodCollection) GetFields() []string {
	return StandardGetFields(&AuthMethod{})
}

// NewItem function
func (amc *AuthMethodCollection) NewItem() loadable.Item {
	*amc = append(*amc, AuthMethod{})
	return &(*amc)[len(*amc)-1]
}

// NewBundleableItemWithKey function
func (amc *AuthMethodCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	am, err := NewAuthMethod(key)
	if err != nil {
		return nil, err
	}
	*amc = append(*amc, *am)
	return &(*amc)[len(*amc)-1], nil
}

// GetKeyFromPath function
func (amc *AuthMethodCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

// GetItem function
func (amc *AuthMethodCollection) GetItem(index int) loadable.Item {
	return &(*amc)[index]
}

// Loop function
func (amc *AuthMethodCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *amc {
		err := iter(amc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (amc *AuthMethodCollection) Len() int {
	return len(*amc)
}

// GetItems function
func (amc *AuthMethodCollection) GetItems() interface{} {
	return *amc
}
