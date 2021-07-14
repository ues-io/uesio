package meta

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// ConfigStoreValueCollection slice
type ConfigStoreValueCollection []ConfigStoreValue

// GetName function
func (cc *ConfigStoreValueCollection) GetName() string {
	return "uesio.configstorevalues"
}

// GetFields function
func (cc *ConfigStoreValueCollection) GetFields() []string {
	return StandardGetFields(&ConfigStoreValue{})
}

// GetItem function
func (cc *ConfigStoreValueCollection) GetItem(index int) loadable.Item {
	return &(*cc)[index]
}

// NewItem function
func (cc *ConfigStoreValueCollection) NewItem() loadable.Item {
	*cc = append(*cc, ConfigStoreValue{})
	return &(*cc)[len(*cc)-1]
}

// Loop function
func (cc *ConfigStoreValueCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *cc {
		err := iter(cc.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (cc *ConfigStoreValueCollection) Len() int {
	return len(*cc)
}

// GetItems function
func (cc *ConfigStoreValueCollection) GetItems() interface{} {
	return *cc
}

// Slice function
func (cc *ConfigStoreValueCollection) Slice(start int, end int) {

}
func (bc *ConfigStoreValueCollection) Filter(iter func(item loadable.Item) (bool, error)) error {
	return nil
}
