package featureflagstore

import (
	"errors"
	"fmt"

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
	assignmentsMap := map[string]interface{}{}
	for _, assignment := range *assignments {
		assignmentsMap[assignment.Flag] = assignment.Value
	}

	for i := range featureFlags {
		ff := featureFlags[i]
		ff.User = user
		value := assignmentsMap[ff.GetKey()]
		if value == nil {
			continue
		}
		ff.Value = value
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

func SetValueFromKey(key string, value interface{}, userID string, session *sess.Session) error {
	FeatureFlag, err := meta.NewFeatureFlag(key)
	if err != nil {
		return err
	}
	err = bundle.Load(FeatureFlag, nil, session, nil)
	if err != nil {
		return err
	}

	user, err := auth.GetUserByID(userID, session, nil)
	if err != nil {
		return err
	}

	return SetValue(FeatureFlag, value, user, session)
}

type ValidationError struct {
	msg string
}

func (ve *ValidationError) Error() string {
	return ve.msg
}

func NewValidationError(msg string) *ValidationError {
	return &ValidationError{
		msg,
	}
}

// ValidateValue checks that the provided value is valid for the FeatureFlag definition
func ValidateValue(ff *meta.FeatureFlag, value interface{}) (bool, *ValidationError) {
	if value == nil {
		return false, NewValidationError("no value provided")
	}
	if ff.Type == "NUMBER" {
		// Make sure the value is coming as something numeric
		floatVal, isFloat := value.(float64)
		if !isFloat {
			return false, NewValidationError("value must be a number")
		}
		int64Val := int64(floatVal)
		// If min/max not defined, they will have zero values, so we are done
		if ff.Min == 0 && ff.Max == 0 {
			return true, nil
		}
		// Check min/max, if defined
		if int64Val < ff.Min {
			return false, NewValidationError(fmt.Sprintf("value must be greater than %d", ff.Min))
		}
		if int64Val > ff.Max {
			return false, NewValidationError(fmt.Sprintf("value must be less than %d", ff.Max))
		}
		return true, nil
	} else {
		// Make sure the value can be converted to a boolean
		if _, isBool := value.(bool); !isBool {
			return false, NewValidationError("invalid value, must be either true or false")
		}
		return true, nil
	}
}

func SetValue(cv *meta.FeatureFlag, value interface{}, user *meta.User, session *sess.Session) error {
	store, err := GetFeatureFlagStore("platform")
	if err != nil {
		return err
	}
	// Valid the value against FeatureFlag metadata
	isValid, err := ValidateValue(cv, value)
	if !isValid {
		return err
	}
	ffa := &meta.FeatureFlagAssignment{
		Flag:  cv.GetKey(),
		Value: value,
		User:  user,
	}
	return store.Set(ffa, session)
}
