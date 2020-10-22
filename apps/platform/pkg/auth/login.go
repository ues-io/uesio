package auth

import (
	"errors"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// Login func
func Login(loginType, token string, site *metadata.Site) (*session.Session, error) {
	// 2. Get the authentication type
	authType, err := GetAuthType(loginType)
	if err != nil {
		return nil, errors.New("Invalid auth type")
	}

	// 4. Verify
	err = authType.Verify(token, site)
	if err != nil {
		return nil, errors.New("JWT Verification failed: " + err.Error())
	}

	// 5. Decode
	claims, err := authType.Decode(token, site)
	if err != nil {
		return nil, errors.New("Cant parse JWT: " + err.Error())
	}

	// 6. Check for Existing User
	user, err := GetUser(claims, site)
	if err != nil {
		return nil, errors.New("Failed Getting User Data: " + err.Error())
	}

	if user == nil {
		// 7. If user doesn't exist, provision one
		user, err = ProvisionUser(claims, site)
		if err != nil {
			return nil, errors.New("Failed Getting User Data: " + err.Error())
		}
	}

	sess, err := CreateSession(user, site)
	if err != nil {
		return nil, errors.New("Failed Creating session" + err.Error())
	}

	return sess, nil
}
