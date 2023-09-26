package environment

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type SecretStore struct {
}

func (ss *SecretStore) Get(key string, session *sess.Session) (string, error) {
	var s meta.SecretStoreValue
	err := datasource.PlatformLoadOne(
		&s,
		&datasource.PlatformLoadOptions{
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
			ServerInitiated: true,
		},
		session,
	)
	if err != nil {
		return "", nil
	}
	return s.Value, nil
}

func (ss *SecretStore) Set(key, value string, session *sess.Session) error {
	s := meta.SecretStoreValue{
		Key:   key,
		Value: value,
	}
	return datasource.PlatformSaveOne(&s, &adapt.SaveOptions{
		Upsert: true,
	}, nil, session)
}
