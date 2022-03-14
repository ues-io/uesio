package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Login func
func Login(loginType, token string, session *sess.Session) (*meta.User, error) {
	// 2. Get the authentication type
	authType, err := getAuthType(loginType)
	if err != nil {
		return nil, errors.New("Invalid auth type")
	}

	// 4. Verify
	err = authType.Verify(token, session)
	if err != nil {
		return nil, errors.New("JWT Verification failed: " + err.Error())
	}

	// 5. Decode
	claims, err := authType.Decode(token, session)
	if err != nil {
		return nil, errors.New("Cant parse JWT: " + err.Error())
	}

	// Bump our permissions a bit so we can make the next two queries
	session.SetPermissions(&meta.PermissionSet{
		CollectionRefs: map[string]bool{
			"uesio.user":       true,
			"uesio.userfiles":   true,
			"uesio.loginmethod": true,
		},
	})

	// 6. Check for Existing User
	loginmethod, err := GetLoginMethod(claims, session)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return nil, errors.New("No Login Method found that matches your claims")
	}

	user, err := GetUserByID(loginmethod.User.ID, session)
	if err != nil {
		return nil, errors.New("Failed Getting User Data: " + err.Error())
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
