package featureflagstore

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type FeatureFlagStore interface {
	Get(user string, assignments *meta.FeatureFlagAssignmentCollection, session *sess.Session) error
	Set(flag *meta.FeatureFlagAssignment, session *sess.Session) error
}

var featureFlagStoreMap = map[string]FeatureFlagStore{}

func GetFeatureFlags(session *sess.Session, user string) (*meta.FeatureFlagCollection, error) {
	featureFlags := meta.FeatureFlagCollection{}

	err := bundle.LoadAllFromAny(&featureFlags, nil, session, nil)
	if err != nil {
		return nil, err
	}

	assignments := &meta.FeatureFlagAssignmentCollection{}
	err = GetValues(user, assignments, session)
	if err != nil {
		return nil, err
	}

	// Make map of assignments
	assignmentsMap := map[string]bool{}
	for _, assignment := range *assignments {
		assignmentsMap[assignment.Flag] = assignment.Value
	}

	for i := range featureFlags {
		ff := featureFlags[i]
		value := assignmentsMap[ff.GetKey()]
		ff.Value = value
		ff.User = user
	}
	return &featureFlags, nil
}

// GetFeatureFlagStore gets an adapter of a certain type
func GetFeatureFlagStore(configStoreType string) (FeatureFlagStore, error) {
	featureFlagAssignment, ok := featureFlagStoreMap[configStoreType]
	if !ok {
		return nil, errors.New("Invalid config store type: " + configStoreType)
	}
	return featureFlagAssignment, nil
}

func RegisterFeatureFlagStore(name string, store FeatureFlagStore) {
	featureFlagStoreMap[name] = store
}

func GetValues(user string, assignments *meta.FeatureFlagAssignmentCollection, session *sess.Session) error {
	store, err := GetFeatureFlagStore("platform")
	if err != nil {
		return err
	}
	return store.Get(user, assignments, session)
}

func SetValueFromKey(key string, value bool, userID string, session *sess.Session) error {
	FeatureFlag, err := meta.NewFeatureFlag(key)
	if err != nil {
		return err
	}
	err = bundle.Load(FeatureFlag, session, nil)
	if err != nil {
		return err
	}

	user, err := auth.GetUserByID(userID, session, nil)
	if err != nil {
		return err
	}

	return SetValue(FeatureFlag, value, user, session)
}

func SetValue(cv *meta.FeatureFlag, value bool, user *meta.User, session *sess.Session) error {
	store, err := GetFeatureFlagStore("platform")
	if err != nil {
		return err
	}
	ffa := &meta.FeatureFlagAssignment{
		Flag:  cv.GetKey(),
		Value: value,
		User:  user,
	}
	return store.Set(ffa, session)
}

func GetStudioFeatureFlags(user string) (*meta.FeatureFlagCollection, error) {
	session := sess.GetStudioAnonSession()
	return GetFeatureFlags(session, user)
}
