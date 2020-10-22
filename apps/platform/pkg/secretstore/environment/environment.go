package environment

import (
	"errors"
	"os"
)

// SecretStore struct
type SecretStore struct {
}

var secretValues = map[string]map[string]map[string]string{
	"studio": {
		"uesio": {
			"googleGCPAPIKey": os.Getenv("GOOGLE_CLOUD_API_KEY"),
		},
		"crm": {
			"aws_access_key_id":     os.Getenv("AWS_ACCESS_KEY_ID"),
			"aws_secret_access_key": os.Getenv("AWS_SECRET_ACCESS_KEY"),
		},
	},
}

// Get function
func (ss *SecretStore) Get(namespace, name, site string) (string, error) {
	errorMessage := "Secret Value not found: " + namespace + " : " + name + " : " + site
	siteStore, ok := secretValues[site]
	if !ok {
		return "", errors.New(errorMessage)
	}
	appStore, ok := siteStore[namespace]
	if !ok {
		return "", errors.New(errorMessage)
	}
	value, ok := appStore[name]
	if !ok {
		return "", errors.New(errorMessage)
	}
	return value, nil
}

// Set function
func (ss *SecretStore) Set(namespace, name, value, site string) error {
	return errors.New("You cannot set secret values in the environment store")
}
