package auth

import (
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

func Check() (*routing.UserMergeData, error) {

	sessid, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}

	userResponse := &routing.LoginResponse{}

	err = call.GetJSON("site/auth/check", sessid, userResponse)
	if err != nil {
		return nil, err
	}

	return userResponse.User, nil

}
