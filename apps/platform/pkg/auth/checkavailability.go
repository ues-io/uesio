package auth

import (
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func CheckAvailability(signupMethodID string, testUsername string, site *meta.Site) (*meta.User, error) {
	payload := map[string]interface{}{"username": testUsername}

	session, err := GetSystemSession(site, nil)
	if err != nil {
		return nil, err
	}

	signupMethod, err := getSignupMethod(signupMethodID, session)
	if err != nil {
		return nil, err
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return nil, err
	}

	if !matchesRegex(username, signupMethod.UsernameRegex) {
		return nil, fmt.Errorf("username does not match required pattern: %s", signupMethod.UsernameFormatExplanation)
	}

	return GetUserByKey(username, session, nil)
}
