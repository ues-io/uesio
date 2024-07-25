package auth

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

func ResetPassword(ctx context.Context, signupMethodID string, payload map[string]interface{}, site *meta.Site) (*meta.LoginMethod, error) {
	session, err := GetSystemSession(ctx, site, nil)
	if err != nil {
		return nil, err
	}

	signupMethod, err := GetSignupMethod(signupMethodID, session)
	if err != nil {
		return nil, err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, nil, session)
	if err != nil {
		return nil, err
	}

	return authconn.ResetPassword(signupMethod, payload)
}

func ConfirmResetPassword(ctx context.Context, signupMethodID string, payload map[string]interface{}, site *meta.Site) (*meta.User, error) {

	session, err := GetSystemSession(ctx, site, nil)
	if err != nil {
		return nil, err
	}

	signupMethod, err := GetSignupMethod(signupMethodID, session)
	if err != nil {
		return nil, err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, nil, session)
	if err != nil {
		return nil, err
	}
	return authconn.ConfirmResetPassword(signupMethod, payload)
}
