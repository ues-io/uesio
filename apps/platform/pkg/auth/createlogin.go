package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func CreateLogin(namespace, name string, payload map[string]interface{}, site *meta.Site) (*meta.SignupMethod, error) {

	signupMethod := &meta.SignupMethod{
		Name:      name,
		Namespace: namespace,
	}

	session, err := GetSystemSession(site, nil)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(signupMethod, session)
	if err != nil {
		return nil, err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, session)
	if err != nil {
		return nil, err
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return nil, err
	}

	if !matchesRegex(username, signupMethod.UsernameRegex) {
		return nil, errors.New("Create Login failed: Regex validation failed")
	}

	claims, err := authconn.CreateLogin(payload, username, session)
	if err != nil {
		return nil, err
	}

	user, err := GetUserByKey(username, session, nil)
	if err != nil {
		return nil, err
	}

	err = CreateLoginMethod(user, signupMethod, claims, session)
	if err != nil {
		return nil, err
	}

	return signupMethod, nil
}
