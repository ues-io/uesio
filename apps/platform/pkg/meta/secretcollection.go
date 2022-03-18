package meta

import (
	"errors"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// SecretCollection slice
type SecretCollection []Secret

// GetName function
func (sc *SecretCollection) GetName() string {
	return "uesio/studio.secrets"
}

// GetFields function
func (sc *SecretCollection) GetFields() []string {
	return StandardGetFields(&Secret{})
}

// NewItem function
func (sc *SecretCollection) NewItem() loadable.Item {
	*sc = append(*sc, Secret{})
	return &(*sc)[len(*sc)-1]
}

// NewBundleableItemWithKey function
func (sc *SecretCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Secret Key: " + key)
	}
	*sc = append(*sc, Secret{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	})
	return &(*sc)[len(*sc)-1], nil
}

// GetKeyFromPath function
func (sc *SecretCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

// GetItem function
func (sc *SecretCollection) GetItem(index int) loadable.Item {
	return &(*sc)[index]
}

// Loop function
func (sc *SecretCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *sc {
		err := iter(sc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (sc *SecretCollection) Len() int {
	return len(*sc)
}

// GetItems function
func (sc *SecretCollection) GetItems() interface{} {
	return *sc
}
