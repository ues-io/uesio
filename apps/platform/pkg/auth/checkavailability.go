package auth

import (
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func CheckAvailability(namespace, name, testUsername string, site *meta.Site) (*meta.User, error) {
	payload := map[string]interface{}{"username": testUsername}

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

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return nil, err
	}

	if !matchesRegex(username, signupMethod.UsernameRegex) {
		return nil, err
	}

	return GetUserByKey(username, session, nil)
}
