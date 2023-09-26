package environment

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type ConfigStore struct {
}

func (cs *ConfigStore) Get(key string, session *sess.Session) (string, error) {
	var cv meta.ConfigStoreValue
	err := datasource.PlatformLoadOne(
		&cv,
		&datasource.PlatformLoadOptions{
			ServerInitiated: true,
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.UNIQUE_KEY_FIELD,
					Value: key,
				},
			},
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/core.value",
				},
			},
		},
		session)
	if err != nil {
		return "", nil
	}
	return cv.Value, nil
}

func (cs *ConfigStore) Set(key, value string, session *sess.Session) error {
	cv := meta.ConfigStoreValue{
		Key:   key,
		Value: value,
	}
	return datasource.PlatformSaveOne(&cv, &adapt.SaveOptions{
		Upsert: true,
	}, nil, session)
}
