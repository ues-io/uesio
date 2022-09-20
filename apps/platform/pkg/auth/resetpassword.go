package auth

import (
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func ResetPassword(authSourceID string, payload map[string]interface{}, session *sess.Session) error {
	conn, err := GetAuthConnection(authSourceID, session)
	if err != nil {
		return err
	}

	err = conn.ResetPassword(payload, session)
	if err != nil {
		return err
	}

	return nil

}
