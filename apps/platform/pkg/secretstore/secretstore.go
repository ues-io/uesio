package secretstore

import "errors"

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
