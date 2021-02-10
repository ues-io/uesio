package environment

import (
	"errors"
	"os"

	"github.com/thecloudmasters/uesio/pkg/logger"
)

// ConfigStore struct
type ConfigStore struct {
}

var configValues = map[string]string{
	"uesio:cognitoClientId":   os.Getenv("COGNITO_CLIENT_ID"),
	"uesio:cognitoPoolId":     os.Getenv("COGNITO_POOL_ID"),
	"uesio:genericFileBucket": os.Getenv("UESIO_PLATFORM_BUCKET"),
	"uesio:googleProjectId": os.Getenv("GOOGLE_CLOUD_PROJECT"),
}

// Get function
func (cs *ConfigStore) Get(key string) (string, error) {
	value, ok := configValues[key]
	if !ok {
		logger.LogError(errors.New("Config Value not found: " + key))
		return "", nil
	}
	return value, nil
}

// Set function
func (cs *ConfigStore) Set(key, value string) error {
	return errors.New("You cannot set config values in the environment store")
}
