package environment

import (
	"errors"
	"log"
	"os"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type ConfigStore struct {
}

func GetRequiredEnv(key string) string {
	value, ok := os.LookupEnv(key)
	if !ok || value == "" {
		log.Fatal(errors.New("Missing environment variable: " + key))
	}
	return value
}

func GetEnvWithDefault(key, defaultValue string) string {
	value, ok := os.LookupEnv(key)
	if !ok || value == "" {
		return defaultValue
	}
	return value
}

var configValues = map[string]string{
	"uesio/core.cognito_client_id":                os.Getenv("COGNITO_CLIENT_ID"),
	"uesio/core.cognito_pool_id":                  os.Getenv("COGNITO_POOL_ID"),
	"uesio/core.mock_auth":                        os.Getenv("UESIO_MOCK_AUTH"),
	"uesio/core.platform_authsource_type":         GetRequiredEnv("UESIO_PLATFORM_AUTHSOURCE_TYPE"),
	"uesio/core.platform_filesource_type":         GetRequiredEnv("UESIO_PLATFORM_FILESOURCE_TYPE"),
	"uesio/core.platform_bundlestore_type":        GetRequiredEnv("UESIO_PLATFORM_BUNDLESTORE_TYPE"),
	"uesio/core.platform_authsource_credentials":  GetRequiredEnv("UESIO_PLATFORM_AUTHSOURCE_CREDENTIALS"),
	"uesio/core.platform_filesource_credentials":  GetEnvWithDefault("UESIO_PLATFORM_FILESOURCE_CREDENTIALS", "uesio/core.localuserfiles"),
	"uesio/core.platform_bundlestore_credentials": GetRequiredEnv("UESIO_PLATFORM_BUNDLESTORE_CREDENTIALS"),
	"uesio/core.aws_region":                       os.Getenv("AWS_REGION"),
	"uesio/core.userfiles_bucket_name":            GetRequiredEnv("UESIO_USERFILES_BUCKET_NAME"),
	"uesio/core.db_host":                          GetRequiredEnv("UESIO_DB_HOST"),
	"uesio/core.db_port":                          GetRequiredEnv("UESIO_DB_PORT"),
	"uesio/core.bundlestore_bucket":               GetRequiredEnv("UESIO_BUNDLES_BUCKET_NAME"),
}

func (cs *ConfigStore) Get(key string, session *sess.Session) (string, error) {
	value, ok := configValues[key]
	if !ok {
		logger.LogError(errors.New("Config Value not found: " + key))
		return "", nil
	}
	return value, nil
}

func (cs *ConfigStore) Set(key, value string, session *sess.Session) error {
	return errors.New("You cannot set config values in the environment store")
}
