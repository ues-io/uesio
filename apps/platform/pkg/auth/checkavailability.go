package auth

import (
	"errors"
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

func CheckLoginMethod(authSourceID string, testUsername string, site *meta.Site) (*meta.LoginMethod, error) {
	session, err := GetSystemSession(site, nil)
	if err != nil {
		return nil, err
	}

	loginmethod, err := GetLoginMethod(&AuthenticationClaims{Subject: testUsername}, authSourceID, session)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	return loginmethod, nil
}
