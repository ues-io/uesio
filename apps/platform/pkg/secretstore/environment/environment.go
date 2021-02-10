package environment

import (
	"errors"
	"os"
)

// SecretStore struct
type SecretStore struct {
}

var secretValues = map[string]string{
	"uesio:googleGCPAPIKey": os.Getenv("GOOGLE_CLOUD_API_KEY"),
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
