package environment

import (
	"errors"
	"os"
)

// SecretStore struct
type SecretStore struct {
}

var secretValues = map[string]string{
	"uesio:google_gcp_api_key":    os.Getenv("GOOGLE_CLOUD_API_KEY"),
	"uesio:aws_access_key_id":     os.Getenv("AWS_ACCESS_KEY_ID"),
	"uesio:aws_secret_access_key": os.Getenv("AWS_SECRET_ACCESS_KEY"),
	"uesio:aws_session_token":     os.Getenv("AWS_SESSION_TOKEN"),
	"uesio:dbuser":                os.Getenv("UESIO_DB_USER"),
	"uesio:dbpassword":            os.Getenv("UESIO_DB_PASSWORD"),
	"uesio:dbdatabase":            os.Getenv("UESIO_DB_DATABASE"),
}

// Get function
func (ss *SecretStore) Get(key string) (string, error) {
	value, ok := secretValues[key]
	if !ok {
		return "", errors.New("Secret Value not found: " + key)
	}
	return value, nil
}

// Set function
func (ss *SecretStore) Set(key, value string) error {
	return errors.New("You cannot set secret values in the environment store")
}
