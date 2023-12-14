package environment

import (
	"errors"
	"os"

	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type SecretStore struct {
}

var secretValues = map[string]string{
	"uesio/core.aws_access_key_id":     os.Getenv("AWS_ACCESS_KEY_ID"),
	"uesio/core.aws_secret_access_key": os.Getenv("AWS_SECRET_ACCESS_KEY"),
	"uesio/core.aws_session_token":     os.Getenv("AWS_SESSION_TOKEN"),
	"uesio/core.db_user":               os.Getenv("UESIO_DB_USER"),
	"uesio/core.db_password":           os.Getenv("UESIO_DB_PASSWORD"),
	"uesio/core.db_database":           os.Getenv("UESIO_DB_DATABASE"),
}

func (ss *SecretStore) Get(key string, session *sess.Session) (string, error) {
	value, ok := secretValues[key]
	if !ok {
		return "", exceptions.NewNotFoundException("Secret Value not found: " + key)
	}
	return value, nil
}

func (ss *SecretStore) Set(key, value string, session *sess.Session) error {
	return errors.New("You cannot set secret values in the environment store")
}
