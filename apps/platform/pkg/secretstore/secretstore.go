package secretstore

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type SecretStore interface {
	Get(ctx context.Context, key string, session *sess.Session) (*meta.SecretStoreValue, error)
	Set(ctx context.Context, key, value string, session *sess.Session) error
	Remove(ctx context.Context, key string, session *sess.Session) error
}

var secretStoreMap = map[string]SecretStore{}

func GetSecretStore(secretStoreType string) (SecretStore, error) {
	secretStore, ok := secretStoreMap[secretStoreType]
	if !ok {
		return nil, fmt.Errorf("invalid secret store type: %s", secretStoreType)
	}
	return secretStore, nil
}

func RegisterSecretStore(name string, store SecretStore) {
	secretStoreMap[name] = store
}

// Generates the default environment variable name for a secret using a naming convention
// "SECRET_<NAMESPACE>_<NAME>", e.g.
// - "uesio/appkit.resend_key" --> "UESIO_SECRET_UESIO_APPKIT_RESEND_KEY"
// - "luigi/foo.stripe_key" --> "UESIO_SECRET_LUIGI_FOO_STRIPE_KEY"
func getEnvironmentVariableName(secret *meta.Secret) string {
	return strings.ToUpper(fmt.Sprintf("UESIO_SECRET_%s_%s", strings.ReplaceAll(secret.Namespace, "/", "_"), secret.Name))
}

func GetSecrets(ctx context.Context, session *sess.Session) (*meta.SecretCollection, error) {

	allSecrets := meta.SecretCollection{}
	err := bundle.LoadAllFromAny(ctx, &allSecrets, nil, session, nil)
	if err != nil {
		return nil, err
	}

	secrets := meta.SecretCollection{}
	for i := range allSecrets {
		sec := allSecrets[i]
		if sec.ManagedBy == "app" || sec.Store == "environment" {
			continue
		}
		secrets = append(secrets, sec)
	}

	return &secrets, nil
}

func getSecretInternal(ctx context.Context, secret *meta.Secret, session *sess.Session) (string, error) {
	store, err := GetSecretStore(secret.Store)
	if err != nil {
		return "", err
	}
	secretValue, err := store.Get(ctx, secret.GetKey(), session)
	if err != nil {
		// If the secret was not found, and we were NOT looking in the environment store,
		// check for an environment variable default using the UESIO_SECRET_ naming convention
		if exceptions.IsNotFoundException(err) && secret.Store != "environment" {
			defaultValueFromEnv := os.Getenv(getEnvironmentVariableName(secret))
			if defaultValueFromEnv != "" {
				return defaultValueFromEnv, nil
			}
		}
		return "", err
	}
	if secretValue != nil {
		return secretValue.Value, nil
	}

	return "", nil

}

func setSecretInternal(ctx context.Context, secret *meta.Secret, value string, session *sess.Session) error {
	store, err := GetSecretStore(secret.Store)
	if err != nil {
		return err
	}
	return store.Set(ctx, secret.GetKey(), value, session)
}

func GetSecret(ctx context.Context, key string, session *sess.Session) (string, error) {
	if key == "" {
		return "", nil
	}
	secret, err := meta.NewSecret(key)
	if err != nil {
		return "", err
	}
	if err = bundle.Load(ctx, secret, nil, session, nil); err != nil {
		return "", err
	}
	return getSecretInternal(ctx, secret, session)

}

func SetSecret(ctx context.Context, key, value string, session *sess.Session) error {
	secret, err := meta.NewSecret(key)
	if err != nil {
		return err
	}
	if err = bundle.Load(ctx, secret, nil, session, nil); err != nil {
		return err
	}
	return setSecretInternal(ctx, secret, value, session)
}

func Remove(ctx context.Context, key string, session *sess.Session) error {
	secret, err := meta.NewSecret(key)
	if err != nil {
		return err
	}
	err = bundle.Load(ctx, secret, nil, session, nil)
	if err != nil {
		return err
	}
	store, err := GetSecretStore(secret.Store)
	if err != nil {
		return err
	}
	return store.Remove(ctx, key, session)
}
