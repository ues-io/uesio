package metadata

import (
	"errors"
	"strings"
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

// AddItem function
func (sc *SecretCollection) AddItem(item BundleableItem) {
	actual := *sc
	secret := item.(*Secret)
	actual = append(actual, *secret)
	*sc = actual
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
