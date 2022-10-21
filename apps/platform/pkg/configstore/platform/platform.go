package environment

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type ConfigStore struct {
}

func (cs *ConfigStore) Get(key string) (string, error) {
	var cv meta.ConfigStoreValue
	headlessSession, err := auth.GetStudioSystemSession(nil)
	if err != nil {
		return "", err
	}
	err = datasource.PlatformLoadOne(
		&cv,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.ID_FIELD,
					Value: key,
				},
			},
		},
		headlessSession)
	if err != nil {
		return "", nil
	}
	return cv.Value, nil
}

func (cs *ConfigStore) Set(key, value string) error {
	cv := meta.ConfigStoreValue{
		Key:   key,
		Value: value,
	}
	headlessSession, err := auth.GetStudioSystemSession(nil)
	if err != nil {
		return err
	}
	return datasource.PlatformSaveOne(&cv, &adapt.SaveOptions{
		Upsert: true,
	}, nil, headlessSession)
}
