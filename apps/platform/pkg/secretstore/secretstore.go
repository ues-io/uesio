package secretstore

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// SecretStore interface
type SecretStore interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

var secretStoreMap = map[string]SecretStore{}

func getSecretKeyParts(secret *meta.Secret, session *sess.Session) []string {
	parts := []string{secret.Namespace, secret.Name}
	if secret.ManagedBy == "app" {
		return parts
	}
	workspace := session.GetWorkspace()
	if workspace != nil {
		return append(parts, "workspace", workspace.GetAppFullName(), workspace.Name)
	}
	site := session.GetSite()
	return append(parts, "site", site.GetFullName())
}

func getSecretKey(secret *meta.Secret, session *sess.Session) string {
	return strings.Join(getSecretKeyParts(secret, session), ":")
}

// GetSecretStore gets an adapter of a certain type
func GetSecretStore(secretStoreType string) (SecretStore, error) {
	secretStore, ok := secretStoreMap[secretStoreType]
	if !ok {
		return nil, errors.New("Invalid secret store type: " + secretStoreType)
	}
	return secretStore, nil
}

// RegisterSecretStore function
func RegisterSecretStore(name string, store SecretStore) {
	secretStoreMap[name] = store
}

// Get key
func GetSecretFromKey(key string, session *sess.Session) (string, error) {
	if key == "" {
		return "", nil
	}

	secret, err := meta.NewSecret(key)
	if err != nil {
		return "", err
	}
	err = bundle.Load(secret, session)
	if err != nil {
		return "", err
	}

	return GetSecret(secret, session)
}

// GetSecret key
func GetSecret(secret *meta.Secret, session *sess.Session) (string, error) {
	// Only use the environment secretstore for now
	store, err := GetSecretStore(secret.Store)
	if err != nil {
		return "", err
	}
	fullKey := getSecretKey(secret, session)
	return store.Get(fullKey)
}

func SetSecretFromKey(key, value string, session *sess.Session) error {
	secret, err := meta.NewSecret(key)
	if err != nil {
		return err
	}
	err = bundle.Load(secret, session)
	if err != nil {
		return err
	}
	return SetSecret(secret, value, session)
}

func SetSecret(secret *meta.Secret, value string, session *sess.Session) error {
	// Only use the environment secretstore for now
	store, err := GetSecretStore(secret.Store)
	if err != nil {
		return err
	}
	fullKey := getSecretKey(secret, session)
	return store.Set(fullKey, value)
}
