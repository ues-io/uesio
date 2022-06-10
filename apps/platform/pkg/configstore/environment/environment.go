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
	"uesio/core:cognito_client_id":                os.Getenv("COGNITO_CLIENT_ID"),
	"uesio/core:cognito_pool_id":                  os.Getenv("COGNITO_POOL_ID"),
	"uesio/core:google_project_id":                os.Getenv("GOOGLE_CLOUD_PROJECT"),
	"uesio/core:mock_auth":                        os.Getenv("UESIO_MOCK_AUTH"),
	"uesio/core:platform_authsource_type":         os.Getenv("UESIO_PLATFORM_AUTHSOURCE_TYPE"),
	"uesio/core:platform_datasource_type":         os.Getenv("UESIO_PLATFORM_DATASOURCE_TYPE"),
	"uesio/core:platform_filesource_type":         os.Getenv("UESIO_PLATFORM_FILESOURCE_TYPE"),
	"uesio/core:platform_bundlestore_type":        os.Getenv("UESIO_PLATFORM_BUNDLESTORE_TYPE"),
	"uesio/core:platform_authsource_credentials":  os.Getenv("UESIO_PLATFORM_AUTHSOURCE_CREDENTIALS"),
	"uesio/core:platform_datasource_credentials":  os.Getenv("UESIO_PLATFORM_DATASOURCE_CREDENTIALS"),
	"uesio/core:platform_filesource_credentials":  os.Getenv("UESIO_PLATFORM_FILESOURCE_CREDENTIALS"),
	"uesio/core:platform_bundlestore_credentials": os.Getenv("UESIO_PLATFORM_BUNDLESTORE_CREDENTIALS"),
	"uesio/core:aws_region":                       os.Getenv("AWS_REGION"),
	"uesio/core:userfiles_bucket_name":            os.Getenv("UESIO_USERFILES_BUCKET_NAME"),
	"uesio/core:db_host":                          os.Getenv("UESIO_DB_HOST"),
	"uesio/core:db_port":                          os.Getenv("UESIO_DB_PORT"),
	"uesio/core:bundlestore_bucket":               os.Getenv("UESIO_BUNDLES_BUCKET_NAME"),
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
