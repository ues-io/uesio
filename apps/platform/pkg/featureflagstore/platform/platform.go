package environment

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// FeatureFlagStore struct
type FeatureFlagStore struct {
}

// Get function
func (ffs *FeatureFlagStore) Get(key string, session *sess.Session) (*meta.FeatureFlagAssignment, error) {
	var ffa meta.FeatureFlagAssignment
	err := datasource.PlatformLoadOne(
		&ffa,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.UNIQUE_KEY_FIELD,
					Value: key,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	return &ffa, nil
}

// Set function
func (ffs *FeatureFlagStore) Set(key string, value bool, user string, session *sess.Session) error {
	ffa := meta.FeatureFlagAssignment{
		Key:   key,
		Value: value,
		User:  user,
	}

	return datasource.PlatformSaveOne(&ffa, &adapt.SaveOptions{
		Upsert: true,
	}, nil, session)
}
