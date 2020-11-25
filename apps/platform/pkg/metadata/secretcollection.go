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
func (sc *SecretCollection) GetFields() []string {
	return []string{"id", "name", "type", "managedby"}
}

// NewItem function
func (sc *SecretCollection) NewItem(key string) (BundleableItem, error) {
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
func (sc *SecretCollection) AddItem(item BundleableItem) {
	*sc = append(*sc, *item.(*Secret))
}

// UnMarshal function
func (sc *SecretCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(sc, data)
}

// Marshal function
func (sc *SecretCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(sc)
}

// GetItem function
func (sc *SecretCollection) GetItem(index int) CollectionableItem {
	actual := *sc
	return &actual[index]
}

// Loop function
func (sc *SecretCollection) Loop(iter func(item CollectionableItem) error) error {
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
