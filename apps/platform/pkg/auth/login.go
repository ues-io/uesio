package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getUserFromClaims(authSourceID string, claims *AuthenticationClaims, session *sess.Session) (*meta.User, error) {
	// Bump our permissions a bit so we can make the next two queries
	session.SetPermissions(&meta.PermissionSet{
		CollectionRefs: map[string]bool{
			"uesio/core.user":        true,
			"uesio/core.userfile":    true,
			"uesio/core.loginmethod": true,
		},
	})

	// 4. Check for Existing User
	loginmethod, err := GetLoginMethod(claims, authSourceID, session)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return nil, errors.New("no Login Method found that matches your claims")
	}

	user, err := GetUserByID(loginmethod.User.ID, session, nil)
	if err != nil {
		return nil, errors.New("failed Getting user Data: " + err.Error())
	}

	return user, nil
}

func Login(authSourceID string, payload map[string]interface{}, session *sess.Session) (*meta.User, error) {
	conn, err := GetAuthConnection(authSourceID, session)
	if err != nil {
		return nil, err
	}

	claims, err := conn.Login(payload, session)
	if err != nil {
		return nil, err
	}

	return getUserFromClaims(authSourceID, claims, session)

}
