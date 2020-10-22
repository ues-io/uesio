package configstore

import "errors"

// ConfigStore interface
type ConfigStore interface {
	Get(namespace, name, site string) (string, error)
	Set(namespace, name, value, site string) error
}

var configStoreMap = map[string]ConfigStore{}

// GetConfigStore gets an adapter of a certain type
func GetConfigStore(configStoreType string) (ConfigStore, error) {
	configStore, ok := configStoreMap[configStoreType]
	if !ok {
		return nil, errors.New("Invalid config store type: " + configStoreType)
	}
	return configStore, nil
}

// RegisterConfigStore function
func RegisterConfigStore(name string, store ConfigStore) {
	configStoreMap[name] = store
}
