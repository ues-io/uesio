package environment

import (
	"errors"
	"log"
	"os"

	"github.com/thecloudmasters/uesio/pkg/logger"
)

type ConfigStore struct {
}

func CheckEnv(key string) string {
	value, ok := os.LookupEnv(key)
	if !ok {
		log.Fatal(errors.New("Missing environment variable: " + key))
	}

	if value == "" {
		logger.Log("environment variable: "+key+" does not have value", logger.ERROR)
	}

	return value
}

var configValues = map[string]string{
	"uesio/core:cognito_client_id":                CheckEnv("COGNITO_CLIENT_ID"),
	"uesio/core:cognito_pool_id":                  CheckEnv("COGNITO_POOL_ID"),
	"uesio/core:google_project_id":                CheckEnv("GOOGLE_CLOUD_PROJECT"),
	"uesio/core:mock_auth":                        CheckEnv("UESIO_MOCK_AUTH"),
	"uesio/core:platform_authsource_type":         CheckEnv("UESIO_PLATFORM_AUTHSOURCE_TYPE"),
	"uesio/core:platform_datasource_type":         CheckEnv("UESIO_PLATFORM_DATASOURCE_TYPE"),
	"uesio/core:platform_filesource_type":         CheckEnv("UESIO_PLATFORM_FILESOURCE_TYPE"),
	"uesio/core:platform_bundlestore_type":        CheckEnv("UESIO_PLATFORM_BUNDLESTORE_TYPE"),
	"uesio/core:platform_authsource_credentials":  CheckEnv("UESIO_PLATFORM_AUTHSOURCE_CREDENTIALS"),
	"uesio/core:platform_datasource_credentials":  CheckEnv("UESIO_PLATFORM_DATASOURCE_CREDENTIALS"),
	"uesio/core:platform_filesource_credentials":  CheckEnv("UESIO_PLATFORM_FILESOURCE_CREDENTIALS"),
	"uesio/core:platform_bundlestore_credentials": CheckEnv("UESIO_PLATFORM_BUNDLESTORE_CREDENTIALS"),
	"uesio/core:aws_region":                       CheckEnv("AWS_REGION"),
	"uesio/core:userfiles_bucket_name":            CheckEnv("UESIO_USERFILES_BUCKET_NAME"),
	"uesio/core:db_host":                          CheckEnv("UESIO_DB_HOST"),
	"uesio/core:db_port":                          CheckEnv("UESIO_DB_PORT"),
	"uesio/core:bundlestore_bucket":               CheckEnv("UESIO_BUNDLES_BUCKET_NAME"),
}

func (cs *ConfigStore) Get(key string) (string, error) {
	value, ok := configValues[key]
	if !ok {
		logger.LogError(errors.New("Config Value not found: " + key))
		return "", nil
	}
	return value, nil
}

func (cs *ConfigStore) Set(key, value string) error {
	return errors.New("You cannot set config values in the environment store")
}
