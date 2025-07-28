package auth

import (
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/preload"
	authtype "github.com/thecloudmasters/uesio/pkg/types/auth"
)

func Check() (*preload.UserMergeData, error) {

	token, err := config.GetToken()
	if err != nil {
		return nil, err
	}

	// If there's no current session id stored, no need to make check call
	if token == "" {
		return nil, nil
	}

	var userResponse authtype.UserResponse

	err = call.GetJSON("site/auth/check", token, &userResponse)
	if err != nil {
		return nil, err
	}

	return userResponse.User, nil

}
