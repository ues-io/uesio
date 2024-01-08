package environment

import (
	"errors"
	"log"
	"log/slog"
	"os"

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
	"uesio/core.mock_auth_usernames":              GetEnvWithDefault("UESIO_MOCK_AUTH_USERNAMES", "ben,abel,wessel,baxter,zach,uesio"),
	"uesio/core.platform_filesource_type":         GetRequiredEnv("UESIO_PLATFORM_FILESOURCE_TYPE"),
	"uesio/core.platform_bundlestore_type":        GetRequiredEnv("UESIO_PLATFORM_BUNDLESTORE_TYPE"),
	"uesio/core.platform_filesource_credentials":  GetEnvWithDefault("UESIO_PLATFORM_FILESOURCE_CREDENTIALS", "uesio/core.localuserfiles"),
	"uesio/core.platform_bundlestore_credentials": GetRequiredEnv("UESIO_PLATFORM_BUNDLESTORE_CREDENTIALS"),
	"uesio/core.aws_region":                       os.Getenv("AWS_REGION"),
	"uesio/core.userfiles_bucket_name":            GetRequiredEnv("UESIO_USERFILES_BUCKET_NAME"),
	"uesio/core.db_host":                          GetRequiredEnv("UESIO_DB_HOST"),
	"uesio/core.db_port":                          GetRequiredEnv("UESIO_DB_PORT"),
	"uesio/core.bundlestore_bucket":               GetRequiredEnv("UESIO_BUNDLES_BUCKET_NAME"),
	"uesio/core.bundle_store_domain":                os.Getenv("UESIO_BUNDLE_STORE_DOMAIN"),
	"uesio/core.primary_domain":                             GetEnvWithDefault("UESIO_PRIMARY_DOMAIN", "localhost"),
}

func (cs *ConfigStore) Get(key string, session *sess.Session) (string, error) {
	value, ok := configValues[key]
	if !ok {
		slog.Debug("Config Value not found: " + key)
		return "", nil
	}
	return value, nil
}

func (cs *ConfigStore) Set(key, value string, session *sess.Session) error {
	return errors.New("you cannot set config values in the environment store")
}
