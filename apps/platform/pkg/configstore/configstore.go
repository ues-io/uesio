package configstore

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

// ConfigStore interface
type ConfigStore interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

var configStoreMap = map[string]ConfigStore{}

func getConfigKeyParts(cv *meta.ConfigValue, session *sess.Session) []string {
	parts := []string{cv.Namespace, cv.Name}
	if cv.ManagedBy == "app" {
		return parts
	}
	workspace := session.GetWorkspace()
	if workspace != nil {
		return append(parts, "workspace", workspace.GetAppFullName(), workspace.Name)
	}
	site := session.GetSite()
	return append(parts, "site", site.GetFullName())
}

func getConfigKey(cv *meta.ConfigValue, session *sess.Session) string {
	return strings.Join(getConfigKeyParts(cv, session), ":")
}

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

// Get key
func GetValueFromKey(key string, session *sess.Session) (string, error) {
	if key == "" {
		return "", nil
	}

	configValue, err := meta.NewConfigValue(key)
	if err != nil {
		return "", err
	}
	err = bundle.Load(configValue, session)
	if err != nil {
		return "", err
	}

	return GetValue(configValue, session)
}

func GetValue(cv *meta.ConfigValue, session *sess.Session) (string, error) {
	// Only use the environment configstore for now
	store, err := GetConfigStore(cv.Store)
	if err != nil {
		return "", err
	}
	fullKey := getConfigKey(cv, session)
	return store.Get(fullKey)
}

func SetValueFromKey(key, value string, session *sess.Session) error {
	configValue, err := meta.NewConfigValue(key)
	if err != nil {
		return err
	}
	err = bundle.Load(configValue, session)
	if err != nil {
		return err
	}
	return SetValue(configValue, value, session)
}

func SetValue(cv *meta.ConfigValue, value string, session *sess.Session) error {
	// Only use the environment configstore for now
	store, err := GetConfigStore(cv.Store)
	if err != nil {
		return err
	}
	fullKey := getConfigKey(cv, session)
	return store.Set(fullKey, value)
}

// Merge function
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
