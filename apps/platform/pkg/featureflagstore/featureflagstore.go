package featureflagstore

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type FeatureFlagStore interface {
	GetMany(ctx context.Context, user string, session *sess.Session) (*meta.FeatureFlagAssignmentCollection, error)
	Get(ctx context.Context, key, user string, session *sess.Session) (*meta.FeatureFlagAssignment, error)
	Set(ctx context.Context, key, user string, value any, session *sess.Session) error
	Remove(ctx context.Context, key, user string, session *sess.Session) error
}

var featureFlagStoreMap = map[string]FeatureFlagStore{}

func GetFeatureFlag(ctx context.Context, key string, session *sess.Session, user string) (*meta.FeatureFlag, error) {
	flag, err := meta.NewFeatureFlag(key)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(ctx, flag, nil, session, nil)
	if err != nil {
		return nil, err
	}

	assignment, err := getValue(ctx, key, user, session)
	if err != nil {
		return nil, err
	}

	flag.User = user
	flag.HasValue = true

	if assignment != nil {
		flag.Value = assignment.Value
	}

	if flag.Value == nil {
		flag.Value = flag.DefaultValue
		flag.HasValue = false
	}

	return flag, nil

}

func GetFeatureFlags(ctx context.Context, session *sess.Session, user string) (*meta.FeatureFlagCollection, error) {
	featureFlags := meta.FeatureFlagCollection{}
	err := bundle.LoadAllFromAny(ctx, &featureFlags, nil, session, nil)
	if err != nil {
		return nil, err
	}

	assignments, err := getValues(ctx, user, session)
	if err != nil {
		return nil, err
	}

	// Make map of assignments
	assignmentsMap := map[string]any{}
	for _, assignment := range *assignments {
		assignmentsMap[assignment.Flag] = assignment.Value
	}

	for i := range featureFlags {
		ff := featureFlags[i]
		ff.User = user
		ff.HasValue = true
		value := assignmentsMap[ff.GetKey()]
		if value == nil {
			ff.Value = ff.DefaultValue
			ff.HasValue = false
			continue
		}
		ff.Value = value
	}
	return &featureFlags, nil
}

func getFeatureFlagStore(configStoreType string) (FeatureFlagStore, error) {
	// TODO: This needs to be synchronized!
	featureFlagAssignment, ok := featureFlagStoreMap[configStoreType]
	if !ok {
		return nil, fmt.Errorf("invalid config store type: %s", configStoreType)
	}
	return featureFlagAssignment, nil
}

func RegisterFeatureFlagStore(name string, store FeatureFlagStore) {
	// TODO: This needs to be synchronized!
	featureFlagStoreMap[name] = store
}

func getValues(ctx context.Context, user string, session *sess.Session) (*meta.FeatureFlagAssignmentCollection, error) {
	store, err := getFeatureFlagStore("platform")
	if err != nil {
		return nil, err
	}
	return store.GetMany(ctx, user, session)
}

func getValue(ctx context.Context, key, userID string, session *sess.Session) (*meta.FeatureFlagAssignment, error) {
	store, err := getFeatureFlagStore("platform")
	if err != nil {
		return nil, err
	}
	return store.Get(ctx, key, userID, session)
}

func Remove(ctx context.Context, key, userID string, session *sess.Session) error {
	store, err := getFeatureFlagStore("platform")
	if err != nil {
		return err
	}
	return store.Remove(ctx, key, userID, session)
}

func SetValue(ctx context.Context, key string, value any, userID string, session *sess.Session) error {
	featureFlag, err := meta.NewFeatureFlag(key)
	if err != nil {
		return err
	}
	err = bundle.Load(ctx, featureFlag, nil, session, nil)
	if err != nil {
		return err
	}
	return setValueInternal(ctx, featureFlag, value, userID, session)
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
func ValidateValue(ff *meta.FeatureFlag, value any) (bool, *ValidationError) {
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

func setValueInternal(ctx context.Context, cv *meta.FeatureFlag, value any, userID string, session *sess.Session) error {
	store, err := getFeatureFlagStore("platform")
	if err != nil {
		return err
	}
	// Valid the value against FeatureFlag metadata
	isValid, err := ValidateValue(cv, value)
	if !isValid {
		return err
	}
	return store.Set(ctx, cv.GetKey(), userID, value, session)
}
