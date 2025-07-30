package environment

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type ConfigStore struct {
}

func (cs *ConfigStore) Get(ctx context.Context, key string, session *sess.Session) (*meta.ConfigStoreValue, error) {
	cv := &meta.ConfigStoreValue{}
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext(ctx, "uesio/core", session, nil)
	if err != nil {
		return nil, err
	}
	err = datasource.PlatformLoadOne(
		ctx,
		cv,
		&datasource.PlatformLoadOptions{
			Conditions: []wire.LoadRequestCondition{
				{
					Field: commonfields.UniqueKey,
					Value: key,
				},
			},
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/core.value",
				},
			},
		},
		versionSession)
	if err != nil {
		if exceptions.IsNotFoundException(err) {
			return nil, nil
		}
		return nil, err

	}
	return cv, nil
}

func (cs *ConfigStore) GetMany(ctx context.Context, keys []string, session *sess.Session) (*meta.ConfigStoreValueCollection, error) {
	results := meta.ConfigStoreValueCollection{}
	// Enter into a version context to be able to interact with the uesio/core.configstorevalue collection
	versionSession, err := datasource.EnterVersionContext(ctx, "uesio/core", session, nil)
	if err != nil {
		return nil, err
	}
	err = datasource.PlatformLoad(
		ctx,
		&results,
		&datasource.PlatformLoadOptions{
			Conditions: []wire.LoadRequestCondition{
				{
					Field:    commonfields.UniqueKey,
					Operator: "IN",
					Values:   keys,
				},
			},
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/core.value",
				},
				{
					ID: "uesio/core.key",
				},
			},
		},
		versionSession)
	if err != nil {
		return nil, err
	}
	return &results, nil
}

func (cs *ConfigStore) Set(ctx context.Context, key, value string, session *sess.Session) error {
	cv := meta.ConfigStoreValue{
		Key:   key,
		Value: value,
	}
	// Enter into a version context to be able to interact with the uesio/core.configstorevalue collection
	versionSession, err := datasource.EnterVersionContext(ctx, "uesio/core", session, nil)
	if err != nil {
		return err
	}
	return datasource.PlatformSaveOne(ctx, &cv, &wire.SaveOptions{
		Upsert: true,
	}, nil, versionSession)
}

func (cs *ConfigStore) Remove(ctx context.Context, key string, session *sess.Session) error {
	// Enter into a version context to be able to interact with the uesio/core.configstorevalue collection
	versionSession, err := datasource.EnterVersionContext(ctx, "uesio/core", session, nil)
	if err != nil {
		return err
	}

	configStoreValue, err := cs.Get(ctx, key, session)
	if err != nil {
		return err
	}

	if configStoreValue == nil {
		return nil
	}

	return datasource.PlatformDeleteOne(ctx, configStoreValue, nil, versionSession)
}
