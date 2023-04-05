package auth

import (
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
)

func Check() (*UserMergeData, error) {

	sessid, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}

	userResponse := &LoginResponse{}

	err = call.GetJSON("site/auth/check", sessid, userResponse)
	if err != nil {
		return nil, err
	}

	return userResponse.User, nil

}
