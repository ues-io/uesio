package auth

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func ForgotPassword(signupMethodID string, payload map[string]interface{}, site *meta.Site) error {
	session, err := GetSystemSession(site, nil)
	if err != nil {
		return err
	}

	signupMethod, err := getSignupMethod(signupMethodID, session)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, session)
	if err != nil {
		return err
	}

	return authconn.ForgotPassword(payload, session)
}

func ConfirmForgotPassword(signupMethodID string, payload map[string]interface{}, site *meta.Site) error {

	session, err := GetSystemSession(site, nil)
	if err != nil {
		return err
	}

	signupMethod, err := getSignupMethod(signupMethodID, session)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, session)
	if err != nil {
		return err
	}
	return authconn.ConfirmForgotPassword(payload, session)
}
