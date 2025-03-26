package auth

import (
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
)

func Check() (*UserMergeData, error) {

	sessid, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}

	// If there's no current session id stored, no need to make check call - test
	if sessid == "" {
		return nil, nil
	}

	userResponse := &LoginResponse{}

	err = call.GetJSON("site/auth/check", sessid, userResponse)
	if err != nil {
		return nil, err
	}

	return userResponse.User, nil

}
