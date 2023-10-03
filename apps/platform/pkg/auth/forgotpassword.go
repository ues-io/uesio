package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

func ForgotPassword(signupMethodID string, payload map[string]interface{}, site *meta.Site) error {
	session, err := GetSystemSession(site, nil)
	if err != nil {
		return err
	}

	signupMethod, err := GetSignupMethod(signupMethodID, session)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, nil, session)
	if err != nil {
		return err
	}

	username, err := GetPayloadValue(payload, "username")
	if err != nil {
		return errors.New("Cognito Forgot Password:" + err.Error())
	}

	err = boostPayloadWithTemplate(username, payload, site, &signupMethod.ForgotPassword)
	if err != nil {
		return err
	}

	return authconn.ForgotPassword(signupMethod, payload)
}

func ConfirmForgotPassword(signupMethodID string, payload map[string]interface{}, site *meta.Site) error {

	session, err := GetSystemSession(site, nil)
	if err != nil {
		return err
	}

	signupMethod, err := GetSignupMethod(signupMethodID, session)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, nil, session)
	if err != nil {
		return err
	}
	return authconn.ConfirmForgotPassword(signupMethod, payload)
}
