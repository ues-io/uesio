package environment

import (
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type ConfigStore struct {
}

func (cs *ConfigStore) Get(key string, session *sess.Session) (*meta.ConfigStoreValue, error) {
	cv := &meta.ConfigStoreValue{}
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return nil, err
	}
	err = datasource.PlatformLoadOne(
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

func (cs *ConfigStore) GetMany(keys []string, session *sess.Session) (*meta.ConfigStoreValueCollection, error) {
	results := meta.ConfigStoreValueCollection{}
	// Enter into a version context to be able to interact with the uesio/core.configstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return nil, err
	}
	err = datasource.PlatformLoad(
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

func (cs *ConfigStore) Set(key, value string, session *sess.Session) error {
	cv := meta.ConfigStoreValue{
		Key:   key,
		Value: value,
	}
	// Enter into a version context to be able to interact with the uesio/core.configstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return err
	}
	return datasource.PlatformSaveOne(&cv, &wire.SaveOptions{
		Upsert: true,
	}, nil, versionSession)
}

func (cs *ConfigStore) Remove(key string, session *sess.Session) error {
	// Enter into a version context to be able to interact with the uesio/core.configstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return err
	}

	configStoreValue, err := cs.Get(key, session)
	if err != nil {
		return err
	}

	if configStoreValue == nil {
		return nil
	}

	return datasource.PlatformDeleteOne(configStoreValue, nil, versionSession)
}
