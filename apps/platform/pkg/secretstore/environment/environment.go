package environment

import (
	"errors"
	"os"
)

// SecretStore struct
type SecretStore struct {
}

var secretValues = map[string]string{
	"uesio:googleGCPAPIKey":    os.Getenv("GOOGLE_CLOUD_API_KEY"),
	"uesio:awsAccessKeyId":     os.Getenv("AWS_ACCESS_KEY_ID"),
	"uesio:awsSecretAccessKey": os.Getenv("AWS_SECRET_ACCESS_KEY"),
	"uesio:awsSessionToken":    os.Getenv("AWS_SESSION_TOKEN"),
	"uesio:dbUser":             os.Getenv("UESIO_DB_USER"),
	"uesio:dbPassword":         os.Getenv("UESIO_DB_PASSWORD"),
	"uesio:dbDatabase":         os.Getenv("UESIO_DB_DATABASE"),
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
