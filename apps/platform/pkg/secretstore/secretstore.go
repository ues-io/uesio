package secretstore

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
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

func GetSecretFromKey(key string, session *sess.Session) (string, error) {
	if key == "" {
		return "", nil
	}

	secret, err := meta.NewSecret(key)
	if err != nil {
		return "", err
	}
	err = bundle.Load(secret, nil, session) //TO-DO
	if err != nil {
		return "", err
	}
	return GetSecret(secret, session)

}

func GetSecret(secret *meta.Secret, session *sess.Session) (string, error) {
	store, err := GetSecretStore(secret.Store)
	if err != nil {
		return "", err
	}
	return store.Get(secret.GetKey(), session)
}

func SetSecretFromKey(key, value string, session *sess.Session) error {
	secret, err := meta.NewSecret(key)
	if err != nil {
		return err
	}
	err = bundle.Load(secret, nil, session) //TO-DO
	if err != nil {
		return err
	}
	return SetSecret(secret, value, session)
}

func SetSecret(secret *meta.Secret, value string, session *sess.Session) error {
	store, err := GetSecretStore(secret.Store)
	if err != nil {
		return err
	}
	return store.Set(secret.GetKey(), value, session)
}
