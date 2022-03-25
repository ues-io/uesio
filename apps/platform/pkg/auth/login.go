package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func TokenLogin(loginType, token string, session *sess.Session) (*meta.User, error) {
	// 1. Get the authentication method and its type
	authMethod, err := getAuthMethod(session, loginType)
	if err != nil {
		return nil, errors.New("authmethod not found")
	}

	authType, err := getAuthType(authMethod.Type)
	if err != nil {
		return nil, err
	}

	// 2. Verify
	err = authType.Verify(token, authMethod.Credentials, session)
	if err != nil {
		return nil, errors.New("JWT Verification failed: " + err.Error())
	}

	// 3. Decode
	claims, err := authType.Decode(token, authMethod.Credentials, session)
	if err != nil {
		return nil, errors.New("Cant parse JWT: " + err.Error())
	}

	// Bump our permissions a bit so we can make the next two queries
	session.SetPermissions(&meta.PermissionSet{
		CollectionRefs: map[string]bool{
			"uesio/core.user":        true,
			"uesio/core.userfiles":   true,
			"uesio/core.loginmethod": true,
		},
	})

	// 4. Check for Existing User
	loginmethod, err := GetLoginMethod(claims, authMethod, session)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return nil, errors.New("no Login Method found that matches your claims")
	}

	user, err := GetUserByID(loginmethod.User.ID, session)
	if err != nil {
		return nil, errors.New("failed Getting user Data: " + err.Error())
	}

	/*
		if user == nil {
			// 7. If user doesn't exist, provision one
			user, err = ProvisionUser(claims, session.GetSite())
			if err != nil {
				return nil, errors.New("Failed Getting User Data: " + err.Error())
			}
		}
	*/

	return user, nil
}
