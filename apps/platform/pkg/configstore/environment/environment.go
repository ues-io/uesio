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
	"uesio/uesio:cognito_client_id":               os.Getenv("COGNITO_CLIENT_ID"),
	"uesio/uesio:cognito_pool_id":                 os.Getenv("COGNITO_POOL_ID"),
	"uesio/uesio:google_project_id":               os.Getenv("GOOGLE_CLOUD_PROJECT"),
	"uesio/uesio:mock_auth":                       os.Getenv("UESIO_MOCK_AUTH"),
	"uesio/uesio:platform_datasource_type":        os.Getenv("UESIO_PLATFORM_DATASOURCE_TYPE"),
	"uesio/uesio:platform_filesource_type":        os.Getenv("UESIO_PLATFORM_FILESOURCE_TYPE"),
	"uesio/uesio:platform_datasource_credentials": os.Getenv("UESIO_PLATFORM_DATASOURCE_CREDENTIALS"),
	"uesio/uesio:platform_filesource_credentials": os.Getenv("UESIO_PLATFORM_FILESOURCE_CREDENTIALS"),
	"uesio/uesio:aws_region":                      os.Getenv("AWS_REGION"),
	"uesio/uesio:userfiles_bucket_name":           os.Getenv("UESIO_USERFILES_BUCKET_NAME"),
	"uesio/uesio:db_host":                         os.Getenv("UESIO_DB_HOST"),
	"uesio/uesio:db_port":                         os.Getenv("UESIO_DB_PORT"),
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
