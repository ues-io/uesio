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
	Get(key string, session *sess.Session) (*meta.FeatureFlagAssignment, error)
	Set(key string, value bool, user string, session *sess.Session) error
}

var featureFlagStoreMap = map[string]FeatureFlagStore{}

func getKeyParts(cv *meta.FeatureFlag, user string, session *sess.Session) []string {
	parts := []string{cv.Namespace, cv.Name}
	if user != "" {
		parts = append(parts, user)
	}
	workspace := session.GetWorkspace()
	if workspace != nil {
		return append(parts, "workspace", workspace.GetAppID(), workspace.Name)
	}
	//site := session.GetSite()
	return parts //append(parts, "site", site.GetFullName())
}

func getKey(cv *meta.FeatureFlag, user string, session *sess.Session) string {
	key := strings.Join(getKeyParts(cv, user, session), ":")
	return key
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
func GetValueFromKey(key string, session *sess.Session) (*meta.FeatureFlagAssignment, error) {
	if key == "" {
		return nil, nil
	}

	FeatureFlag, err := meta.NewFeatureFlag(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(FeatureFlag, session)
	if err != nil {
		return nil, err
	}

	return GetValue(FeatureFlag, "", session)
}

func GetValue(cv *meta.FeatureFlag, user string, session *sess.Session) (*meta.FeatureFlagAssignment, error) {
	// Only use platform
	store, err := GetFeatureFlagStore("platform")
	if err != nil {
		return nil, err
	}
	fullKey := getKey(cv, user, session)
	return store.Get(fullKey, session)
}

func SetValueFromKey(key string, value bool, user string, session *sess.Session) error {
	FeatureFlag, err := meta.NewFeatureFlag(key)
	if err != nil {
		return err
	}
	err = bundle.Load(FeatureFlag, session)
	if err != nil {
		return err
	}
	return SetValue(FeatureFlag, value, user, session)
}

func SetValue(cv *meta.FeatureFlag, value bool, user string, session *sess.Session) error {
	// Only use platform
	store, err := GetFeatureFlagStore("platform")
	if err != nil {
		return err
	}
	fullKey := getKey(cv, user, session)
	return store.Set(fullKey, value, user, session)
}

// Merge function
func Merge(template string, session *sess.Session) (string, error) {
	featureTemplate, err := templating.NewWithFunc(template, func(m map[string]interface{}, key string) (interface{}, error) {
		return GetValueFromKey(key, session)
	})
	if err != nil {
		return "", err
	}

	value, err := templating.Execute(featureTemplate, nil)
	if err != nil {
		return "", err
	}
	return value, nil
}
