package configstore

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type ConfigStore interface {
	Get(key string, session *sess.Session) (string, error)
	GetMany(keys []string, session *sess.Session) (meta.ConfigStoreValueCollection, error)
	Set(key, value string, session *sess.Session) error
}

var configStoreMap = map[string]ConfigStore{}

type ConfigLoadOptions struct {
	OnlyWriteable bool
}

func GetConfigValues(session *sess.Session, options *ConfigLoadOptions) (*meta.ConfigValueCollection, error) {
	if options == nil {
		options = &ConfigLoadOptions{}
	}
	allConfigValues := meta.ConfigValueCollection{}
	err := bundle.LoadAllFromAny(&allConfigValues, nil, session, nil)
	if err != nil {
		return nil, err
	}

	configValues := meta.ConfigValueCollection{}
	for i := range allConfigValues {
		cv := allConfigValues[i]
		if options.OnlyWriteable && (cv.ManagedBy == "app" || cv.Store == "environment") {
			continue
		}
		configValues = append(configValues, cv)
	}

	configValuesByStore := map[string]meta.ConfigValueCollection{}

	for i := range configValues {
		cv := configValues[i]
		_, ok := configValuesByStore[cv.Store]
		if !ok {
			configValuesByStore[cv.Store] = meta.ConfigValueCollection{}
		}
		configValuesByStore[cv.Store] = append(configValuesByStore[cv.Store], cv)
	}

	for storeName, configValuesForStore := range configValuesByStore {
		store, err := GetConfigStore(storeName)
		if err != nil {
			return nil, err
		}

		keys := make([]string, len(configValuesForStore))
		for i, cv := range configValuesForStore {
			keys[i] = cv.GetKey()
		}

		values, err := store.GetMany(keys, session)
		if err != nil {
			return nil, err
		}

		// Now make a map of our results
		valuesMap := map[string]string{}
		for _, value := range values {
			valuesMap[value.Key] = value.Value
		}

		for _, cv := range configValuesForStore {
			value, ok := valuesMap[cv.GetKey()]
			if !ok || value == "" {
				cv.Value = cv.DefaultValue
				continue
			}
			cv.Value = value
		}

	}
	return &configValues, nil
}

// GetConfigStore gets an adapter of a certain type
func GetConfigStore(configStoreType string) (ConfigStore, error) {
	configStore, ok := configStoreMap[configStoreType]
	if !ok {
		return nil, errors.New("Invalid config store type: " + configStoreType)
	}
	return configStore, nil
}

func RegisterConfigStore(name string, store ConfigStore) {
	configStoreMap[name] = store
}

func GetValueFromKey(key string, session *sess.Session) (string, error) {
	if key == "" {
		return "", nil
	}

	configValue, err := meta.NewConfigValue(key)
	if err != nil {
		return "", err
	}
	err = bundle.Load(configValue, session, nil)
	if err != nil {
		return "", err
	}

	return GetValue(configValue, session)
}

func GetValue(cv *meta.ConfigValue, session *sess.Session) (string, error) {
	store, err := GetConfigStore(cv.Store)
	if err != nil {
		return "", err
	}
	storeValue, err := store.Get(cv.GetKey(), session)
	if err != nil {
		return "", err
	}
	if storeValue != "" {
		return storeValue, nil
	}
	if cv.DefaultValue != "" {
		return cv.DefaultValue, nil
	}
	return "", nil
}

func SetValueFromKey(key, value string, session *sess.Session) error {
	configValue, err := meta.NewConfigValue(key)
	if err != nil {
		return err
	}
	err = bundle.Load(configValue, session, nil)
	if err != nil {
		return err
	}
	return SetValue(configValue, value, session)
}

func SetValue(cv *meta.ConfigValue, value string, session *sess.Session) error {
	store, err := GetConfigStore(cv.Store)
	if err != nil {
		return err
	}
	return store.Set(cv.GetKey(), value, session)
}

func Merge(template string, session *sess.Session) (string, error) {
	configTemplate, err := templating.NewWithFunc(template, func(m map[string]interface{}, key string) (interface{}, error) {
		return GetValueFromKey(key, session)
	})
	if err != nil {
		return "", err
	}

	value, err := templating.Execute(configTemplate, nil)
	if err != nil {
		return "", err
	}
	return value, nil
}
