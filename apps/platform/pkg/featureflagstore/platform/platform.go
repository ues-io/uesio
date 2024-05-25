package environment

import (
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type FeatureFlagStore struct{}

func (ffs *FeatureFlagStore) Get(user string, assignments *meta.FeatureFlagAssignmentCollection, session *sess.Session) error {
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return err
	}
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
		versionSession,
	)
}

func (ffs *FeatureFlagStore) Set(flag *meta.FeatureFlagAssignment, session *sess.Session) error {
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return err
	}
	return datasource.PlatformSaveOne(flag, &wire.SaveOptions{
		Upsert: true,
	}, nil, versionSession)
}
