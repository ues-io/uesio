package environment

import (
	"errors"
	"os"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type SecretStore struct {
}

var secretValues = map[string]string{
	"uesio/core.aws_access_key_id":      os.Getenv("UESIO_AWS_ACCESS_KEY_ID"),
	"uesio/core.aws_secret_access_key":  os.Getenv("UESIO_AWS_SECRET_ACCESS_KEY"),
	"uesio/core.aws_session_token":      os.Getenv("UESIO_AWS_SESSION_TOKEN"),
	"uesio/aikit.aws_access_key_id":     os.Getenv("UESIO_AWS_ACCESS_KEY_ID"),
	"uesio/aikit.aws_secret_access_key": os.Getenv("UESIO_AWS_SECRET_ACCESS_KEY"),
	"uesio/aikit.aws_session_token":     os.Getenv("UESIO_AWS_SESSION_TOKEN"),
	"uesio/core.db_user":                os.Getenv("UESIO_DB_USER"),
	"uesio/core.db_password":            os.Getenv("UESIO_DB_PASSWORD"),
	"uesio/core.db_database":            os.Getenv("UESIO_DB_DATABASE"),
}

func (ss *SecretStore) Get(key string, session *sess.Session) (*meta.SecretStoreValue, error) {
	value, ok := secretValues[key]
	if !ok {
		return nil, exceptions.NewNotFoundException("Secret Value not found: " + key)
	}
	return &meta.SecretStoreValue{
		Value: value,
		Key:   key,
	}, nil
}

func (ss *SecretStore) Set(key, value string, session *sess.Session) error {
	return errors.New("You cannot set secret values in the environment store")
}

func (ss *SecretStore) Remove(key string, session *sess.Session) error {
	return errors.New("You cannot remove secret values in the environment store")
}
