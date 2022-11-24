package auth

import (
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func ForgotPassword(authSourceID string, payload map[string]interface{}, session *sess.Session) error {
	conn, err := GetAuthConnection(authSourceID, session)
	if err != nil {
		return err
	}

	payload["subject"] = "LOL"
	payload["message"] = "LOL"

	return conn.ForgotPassword(payload, session)
}

func ConfirmForgotPassword(authSourceID string, payload map[string]interface{}, session *sess.Session) error {
	conn, err := GetAuthConnection(authSourceID, session)
	if err != nil {
		return err
	}

	return conn.ConfirmForgotPassword(payload, session)
}
