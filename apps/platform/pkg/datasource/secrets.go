package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetSecretFromKey(key string, session *sess.Session) (string, error) {
	if key == "" {
		return "", nil
	}

	secret, err := meta.NewSecret(key)
	if err != nil {
		return "", err
	}
	// Enter into a version context to fetch the secret from core namespace
	versionSession, err := EnterVersionContext("uesio/core", session, nil)
	err = bundle.Load(secret, versionSession, nil)
	if err != nil {
		return "", err
	}
	return secretstore.GetSecret(secret, versionSession)

}

func SetSecretFromKey(key, value string, session *sess.Session) error {
	secret, err := meta.NewSecret(key)
	if err != nil {
		return err
	}
	// Enter into a version context to fetch the secret from core namespace
	versionSession, err := EnterVersionContext("uesio/core", session, nil)
	err = bundle.Load(secret, versionSession, nil)
	if err != nil {
		return err
	}
	return secretstore.SetSecret(secret, value, versionSession)
}
