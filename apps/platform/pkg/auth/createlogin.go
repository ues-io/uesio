package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func CreateLogin(signupMethodID string, payload map[string]interface{}, siteAdminSession *sess.Session) (*meta.SignupMethod, error) {

	siteAdmin := siteAdminSession.GetSiteAdmin()

	session, err := GetSystemSession(siteAdmin, nil)
	if err != nil {
		return nil, err
	}

	signupMethod, err := GetSignupMethod(signupMethodID, session)
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

	err = boostPayloadWithTemplate(username, payload, siteAdmin, &signupMethod.AdminCreate)
	if err != nil {
		return nil, err
	}

	claims, err := authconn.CreateLogin(payload, username, session)
	if err != nil {
		return nil, err
	}

	user, err := GetUserByKey(username, session, nil)
	if err != nil {
		return nil, err
	}

	err = CreateLoginMethod(user, signupMethod, claims, nil, session)
	if err != nil {
		return nil, err
	}

	return signupMethod, nil
}
