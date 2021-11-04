package featureflagstore

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
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
	return parts
}

func getKey(cv *meta.FeatureFlag, user string, session *sess.Session) string {
	return strings.Join(getKeyParts(cv, user, session), ":")
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
	store, err := GetFeatureFlagStore("platform")
	if err != nil {
		return err
	}
	fullKey := getKey(cv, user, session)
	return store.Set(fullKey, value, user, session)
}
