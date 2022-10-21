package environment

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type SecretStore struct {
}

func (ss *SecretStore) Get(key string) (string, error) {
	var s meta.SecretStoreValue
	session, err := auth.GetStudioSystemSession(nil)
	if err != nil {
		return "", err
	}
	err = datasource.PlatformLoadOne(
		&s,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.ID_FIELD,
					Value: key,
				},
			},
		},
		session,
	)
	if err != nil {
		return "", nil
	}
	return s.Value, nil
}

func (ss *SecretStore) Set(key, value string) error {
	s := meta.SecretStoreValue{
		Key:   key,
		Value: value,
	}
	session, err := auth.GetStudioSystemSession(nil)
	if err != nil {
		return err
	}
	return datasource.PlatformSaveOne(&s, &adapt.SaveOptions{
		Upsert: true,
	}, nil, session)
}
