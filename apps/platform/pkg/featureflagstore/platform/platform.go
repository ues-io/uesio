package environment

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type FeatureFlagStore struct{}

func (ffs *FeatureFlagStore) Get(user string, assignments *meta.FeatureFlagAssignmentCollection, session *sess.Session) error {
	return datasource.PlatformLoad(
		assignments,
		&datasource.PlatformLoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/core.value",
				},
				{
					ID: "uesio/core.flag",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/core.user",
					Value:    user,
					Operator: "=",
				},
			},
			ServerInitiated: true,
		},
		session,
	)
}

func (ffs *FeatureFlagStore) Set(flag *meta.FeatureFlagAssignment, session *sess.Session) error {
	return datasource.PlatformSaveOne(flag, &adapt.SaveOptions{
		Upsert: true,
	}, nil, session)
}
