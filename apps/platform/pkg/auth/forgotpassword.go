package auth

import (
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func ForgotPassword(authSourceID string, payload map[string]interface{}, session *sess.Session) error {
	conn, err := GetAuthConnection(authSourceID, session)
	if err != nil {
		return err
	}

	err = conn.ForgotPassword(payload, session)
	if err != nil {
		return err
	}

	return nil

}

func ConfirmForgotPassword(authSourceID string, payload map[string]interface{}, session *sess.Session) error {
	conn, err := GetAuthConnection(authSourceID, session)
	if err != nil {
		return err
	}

	err = conn.ConfirmForgotPassword(payload, session)
	if err != nil {
		return err
	}

	return nil

}
