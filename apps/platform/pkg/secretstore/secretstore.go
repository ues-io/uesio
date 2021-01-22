package secretstore

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

// SecretStore interface
type SecretStore interface {
	Get(namespace, name, site string) (string, error)
	Set(namespace, name, value, site string) error
}

var secretStoreMap = map[string]SecretStore{}

// GetSecretStore gets an adapter of a certain type
func GetSecretStore(secretStoreType string) (SecretStore, error) {
	secretStore, ok := secretStoreMap[secretStoreType]
	if !ok {
		return nil, errors.New("Invalid secret store type: " + secretStoreType)
	}
	return secretStore, nil
}

// RegisterSecretStore function
func RegisterSecretStore(name string, store SecretStore) {
	secretStoreMap[name] = store
}

// GetSecret key
func GetSecret(key string, site *meta.Site) (string, error) {
	if key == "" {
		return "", nil
	}

	namespace, name, err := meta.ParseKey(key)
	if err != nil {
		return "", errors.New("Failed Parsing Secret Key: " + key + " : " + err.Error())
	}

	// Only use the environment secretstore for now
	store, err := GetSecretStore("environment")
	if err != nil {
		return "", err
	}

	return store.Get(namespace, name, site.Name)

}
