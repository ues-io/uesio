package environment

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type FeatureFlagStore struct{}

func (ffs *FeatureFlagStore) GetMany(user string, session *sess.Session) (*meta.FeatureFlagAssignmentCollection, error) {
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return nil, err
	}
	assignments := &meta.FeatureFlagAssignmentCollection{}
	err = datasource.PlatformLoad(
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
	if err != nil {
		return nil, err
	}
	return assignments, nil
}

func (ffs *FeatureFlagStore) Get(key, user string, session *sess.Session) (*meta.FeatureFlagAssignment, error) {
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return nil, err
	}
	assignments := meta.FeatureFlagAssignmentCollection{}
	err = datasource.PlatformLoad(
		&assignments,
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
				{
					Field:    "uesio/core.flag",
					Value:    key,
					Operator: "=",
				},
			},
		},
		versionSession,
	)
	if err != nil {
		return nil, err
	}
	length := len(assignments)
	if length > 1 {
		return nil, errors.New("Too many Assignments")
	}
	if length == 1 {
		return assignments[0], nil
	}
	return nil, nil
}

func (ffs *FeatureFlagStore) Set(key, user string, value any, session *sess.Session) error {
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return err
	}
	return datasource.PlatformSaveOne(&meta.FeatureFlagAssignment{
		Flag:  key,
		Value: value,
		User: &meta.User{
			BuiltIn: meta.BuiltIn{ID: user},
		},
	}, &wire.SaveOptions{
		Upsert: true,
	}, nil, versionSession)
}

func (ffs *FeatureFlagStore) Remove(key, user string, session *sess.Session) error {
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return err
	}

	assignment, err := ffs.Get(key, user, session)
	if err != nil {
		return err
	}

	if assignment == nil {
		return nil
	}

	return datasource.PlatformDeleteOne(assignment, nil, versionSession)
}
