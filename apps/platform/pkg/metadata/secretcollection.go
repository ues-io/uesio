package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// SecretCollection slice
type SecretCollection []Secret

// GetName function
func (sc *SecretCollection) GetName() string {
	return "secrets"
}

// GetFields function
func (sc *SecretCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(sc)
}

// NewItem function
func (sc *SecretCollection) NewItem() LoadableItem {
	return &Secret{}
}

// NewBundleableItem function
func (sc *SecretCollection) NewBundleableItem() BundleableItem {
	return &Secret{}
}

// NewBundleableItem function
func (sc *SecretCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, ".")
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Secret Key: " + key)
	}
	return &Secret{
		Namespace: keyArray[0],
		Name:      keyArray[1],
	}, nil
}

// GetKeyPrefix function
func (sc *SecretCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	return ""
}

// AddItem function
func (sc *SecretCollection) AddItem(item LoadableItem) {
	*sc = append(*sc, *item.(*Secret))
}

// GetItem function
func (sc *SecretCollection) GetItem(index int) LoadableItem {
	actual := *sc
	return &actual[index]
}

// Loop function
func (sc *SecretCollection) Loop(iter func(item LoadableItem) error) error {
	for index := range *sc {
		err := iter(sc.GetItem(index))
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
