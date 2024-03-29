package environment

import (
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type SecretStore struct {
}

func (ss *SecretStore) Get(key string, session *sess.Session) (string, error) {
	var s meta.SecretStoreValue
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return "", err
	}
	if err = datasource.PlatformLoadOne(
		&s,
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
		versionSession,
	); err != nil {
		return "", exceptions.NewNotFoundException("Secret Value not found: " + key)
	}
	return s.Value, nil
}

func (ss *SecretStore) Set(key, value string, session *sess.Session) error {
	s := meta.SecretStoreValue{
		Key:   key,
		Value: value,
	}
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return err
	}
	return datasource.PlatformSaveOne(&s, &wire.SaveOptions{
		Upsert: true,
	}, nil, versionSession)
}
