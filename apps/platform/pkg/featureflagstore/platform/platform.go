package environment

import (
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type FeatureFlagStore struct{}

func (ffs *FeatureFlagStore) Get(user string, assignments *meta.FeatureFlagAssignmentCollection, session *sess.Session) error {
	return datasource.PlatformLoad(
		assignments,
		&datasource.PlatformLoadOptions{
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/core.value",
				},
				{
					ID: "uesio/core.flag",
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field:    "uesio/core.user",
					Value:    user,
					Operator: "=",
				},
			},
		},
		session,
	)
}

func (ffs *FeatureFlagStore) Set(flag *meta.FeatureFlagAssignment, session *sess.Session) error {
	return datasource.PlatformSaveOne(flag, &wire.SaveOptions{
		Upsert: true,
	}, nil, session)
}
