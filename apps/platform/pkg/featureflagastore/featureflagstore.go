package featureflagstore

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

// FeatureFlagStore interface
type FeatureFlagStore interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

var featureFlagStoreMap = map[string]FeatureFlagStore{}

func getConfigKeyParts(cv *meta.FeatureFlag, session *sess.Session) []string {
	parts := []string{cv.Namespace, cv.Name}
	// if cv.ManagedBy == "app" {
	// 	return parts
	// }
	workspace := session.GetWorkspace()
	if workspace != nil {
		return append(parts, "workspace", workspace.GetAppID(), workspace.Name)
	}
	site := session.GetSite()
	return append(parts, "site", site.GetFullName())
}

func getConfigKey(cv *meta.FeatureFlag, session *sess.Session) string {
	return strings.Join(getConfigKeyParts(cv, session), ":")
}

// GetFeatureFlagStore gets an adapter of a certain type
func GetFeatureFlagStore(configStoreType string) (FeatureFlagStore, error) {
	featureFlagAssignment, ok := featureFlagStoreMap[configStoreType]
	if !ok {
		return nil, errors.New("Invalid config store type: " + configStoreType)
	}
	return featureFlagAssignment, nil
}

// RegisterFeatureFlagStore function
func RegisterFeatureFlagStore(name string, store FeatureFlagStore) {
	featureFlagStoreMap[name] = store
}

// Get key
func GetValueFromKey(key string, session *sess.Session) (string, error) {
	if key == "" {
		return "", nil
	}

	FeatureFlag, err := meta.NewFeatureFlag(key)
	if err != nil {
		return "", err
	}
	err = bundle.Load(FeatureFlag, session)
	if err != nil {
		return "", err
	}

	return GetValue(FeatureFlag, session)
}

func GetValue(cv *meta.FeatureFlag, session *sess.Session) (string, error) {
	// Only use the environment featureflagstore for now
	// store, err := GetFeatureFlagStore(cv.Store)
	// if err != nil {
	// 	return "", err
	// }
	// fullKey := getConfigKey(cv, session)
	// return store.Get(fullKey)
	return "", nil
}

func SetValueFromKey(key, value string, session *sess.Session) error {
	FeatureFlag, err := meta.NewFeatureFlag(key)
	if err != nil {
		return err
	}
	err = bundle.Load(FeatureFlag, session)
	if err != nil {
		return err
	}
	return SetValue(FeatureFlag, value, session)
}

func SetValue(cv *meta.FeatureFlag, value string, session *sess.Session) error {
	// Only use the environment featureflagstore for now
	// store, err := GetFeatureFlagStore(cv.Store)
	// if err != nil {
	// 	return err
	// }
	// fullKey := getConfigKey(cv, session)
	// return store.Set(fullKey, value)
	return nil
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
