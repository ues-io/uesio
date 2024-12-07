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

func (ss *SecretStore) Get(key string, session *sess.Session) (*meta.SecretStoreValue, error) {
	s := &meta.SecretStoreValue{}
	// Enter into a version context to be able to interact with the uesio/core.secretstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return nil, err
	}
	if err = datasource.PlatformLoadOne(
		s,
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
		return nil, exceptions.NewNotFoundException("Secret Value not found: " + key)
	}
	return s, nil
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

func (ss *SecretStore) Remove(key string, session *sess.Session) error {
	// Enter into a version context to be able to interact with the uesio/core.configstorevalue collection
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, nil)
	if err != nil {
		return err
	}

	secretStoreValue, err := ss.Get(key, session)
	if err != nil {
		if exceptions.IsNotFoundException(err) {
			return nil
		}
	}

	if secretStoreValue == nil {
		return nil
	}

	return datasource.PlatformDeleteOne(secretStoreValue, nil, versionSession)
}
