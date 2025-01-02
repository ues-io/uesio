package environment

import (
	"errors"
	"log"
	"log/slog"
	"os"

	"github.com/thecloudmasters/uesio/pkg/meta"
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
	"uesio/core.mock_auth":                        os.Getenv("UESIO_MOCK_AUTH"),
	"uesio/core.platform_filesource_type":         GetEnvWithDefault("UESIO_PLATFORM_FILESOURCE_TYPE", "uesio.s3"),
	"uesio/core.platform_bundlestore_type":        GetEnvWithDefault("UESIO_PLATFORM_BUNDLESTORE_TYPE", "uesio.s3"),
	"uesio/core.platform_filesource_credentials":  GetEnvWithDefault("UESIO_PLATFORM_FILESOURCE_CREDENTIALS", "uesio/core.aws"),
	"uesio/core.platform_bundlestore_credentials": GetEnvWithDefault("UESIO_PLATFORM_BUNDLESTORE_CREDENTIALS", "uesio/core.aws"),
	"uesio/core.aws_region":                       os.Getenv("AWS_REGION"),
	"uesio/core.aws_endpoint":                     os.Getenv("AWS_ENDPOINT"),
	"uesio/aikit.aws_region":                      os.Getenv("AWS_REGION"),
	"uesio/core.userfiles_bucket_name":            GetEnvWithDefault("UESIO_USERFILES_BUCKET_NAME", "uesio-userfiles"),
	"uesio/core.db_host":                          GetRequiredEnv("UESIO_DB_HOST"),
	"uesio/core.db_port":                          GetEnvWithDefault("UESIO_DB_PORT", "5432"),
	"uesio/core.db_sslmode":                       GetEnvWithDefault("UESIO_DB_SSLMODE", "disable"),
	"uesio/core.bundlestore_bucket":               GetEnvWithDefault("UESIO_BUNDLES_BUCKET_NAME", "uesio-bundles"),
	"uesio/core.bundle_store_domain":              os.Getenv("UESIO_BUNDLE_STORE_DOMAIN"),
	"uesio/core.primary_domain":                   GetEnvWithDefault("UESIO_PRIMARY_DOMAIN", "localhost"),
}

func (cs *ConfigStore) Get(key string, session *sess.Session) (*meta.ConfigStoreValue, error) {
	value, ok := configValues[key]
	if !ok {
		slog.Debug("Config Value not found: " + key)
		return nil, nil
	}
	return &meta.ConfigStoreValue{
		Key:   key,
		Value: value,
	}, nil
}

func (cs *ConfigStore) GetMany(keys []string, session *sess.Session) (*meta.ConfigStoreValueCollection, error) {
	results := meta.ConfigStoreValueCollection{}
	for _, key := range keys {
		value, err := cs.Get(key, session)
		if err != nil {
			return nil, err
		}
		results = append(results, value)
	}
	return &results, nil
}

func (cs *ConfigStore) Set(key, value string, session *sess.Session) error {
	return errors.New("you cannot set config values in the environment store")
}

func (cs *ConfigStore) Remove(key string, session *sess.Session) error {
	return errors.New("you cannot remove config values from the environment store")
}
