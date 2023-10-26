package secretstore

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type SecretStore interface {
	Get(key string, session *sess.Session) (string, error)
	Set(key, value string, session *sess.Session) error
}

var secretStoreMap = map[string]SecretStore{}

func GetSecretStore(secretStoreType string) (SecretStore, error) {
	secretStore, ok := secretStoreMap[secretStoreType]
	if !ok {
		return nil, errors.New("Invalid secret store type: " + secretStoreType)
	}
	return secretStore, nil
}

func RegisterSecretStore(name string, store SecretStore) {
	secretStoreMap[name] = store
}

func GetSecret(secret *meta.Secret, session *sess.Session) (string, error) {
	store, err := GetSecretStore(secret.Store)
	if err != nil {
		return "", err
	}
	return store.Get(secret.GetKey(), session)
}

func SetSecret(secret *meta.Secret, value string, session *sess.Session) error {
	store, err := GetSecretStore(secret.Store)
	if err != nil {
		return err
	}
	return store.Set(secret.GetKey(), value, session)
}
