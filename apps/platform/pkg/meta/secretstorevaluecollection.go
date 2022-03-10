package meta

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// SecretStoreValueCollection slice
type SecretStoreValueCollection []SecretStoreValue

// GetName function
func (sc *SecretStoreValueCollection) GetName() string {
	return "uesio.secretstorevalues"
}

// GetFields function
func (sc *SecretStoreValueCollection) GetFields() []string {
	return StandardGetFields(&SecretStoreValue{})
}

// GetItem function
func (sc *SecretStoreValueCollection) GetItem(index int) loadable.Item {
	return &(*sc)[index]
}

// NewItem function
func (sc *SecretStoreValueCollection) NewItem() loadable.Item {
	*sc = append(*sc, SecretStoreValue{})
	return &(*sc)[len(*sc)-1]
}

// Loop function
func (sc *SecretStoreValueCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *sc {
		err := iter(sc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (sc *SecretStoreValueCollection) Len() int {
	return len(*sc)
}

// GetItems function
func (sc *SecretStoreValueCollection) GetItems() interface{} {
	return *sc
}
