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

func (cs *ConfigStore) Get(key string, session *sess.Session) (string, error) {
	var cv meta.ConfigStoreValue
	err := datasource.PlatformLoadOne(
		&cv,
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
		session)
	if err != nil {
		if exceptions.IsNotFoundException(err) {
			return "", nil
		}
		return "", err

	}
	return cv.Value, nil
}

func (cs *ConfigStore) GetMany(keys []string, session *sess.Session) (meta.ConfigStoreValueCollection, error) {
	results := meta.ConfigStoreValueCollection{}
	err := datasource.PlatformLoad(
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
		session)
	if err != nil {
		return nil, err
	}
	return results, nil
}

func (cs *ConfigStore) Set(key, value string, session *sess.Session) error {
	cv := meta.ConfigStoreValue{
		Key:   key,
		Value: value,
	}
	return datasource.PlatformSaveOne(&cv, &wire.SaveOptions{
		Upsert: true,
	}, nil, session)
}
