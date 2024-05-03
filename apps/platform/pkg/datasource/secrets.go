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
	if err = bundle.Load(secret, nil, session, nil); err != nil {
		return "", err
	}
	return secretstore.GetSecret(secret, session)

}

func SetSecretFromKey(key, value string, session *sess.Session) error {
	secret, err := meta.NewSecret(key)
	if err != nil {
		return err
	}
	if err = bundle.Load(secret, nil, session, nil); err != nil {
		return err
	}
	return secretstore.SetSecret(secret, value, session)
}
