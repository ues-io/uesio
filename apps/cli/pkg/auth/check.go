package auth

import (
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/preload"
)

func Check() (*preload.UserMergeData, error) {

	sessid, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}

	// If there's no current session id stored, no need to make check call
	if sessid == "" {
		return nil, nil
	}

	var userResponse auth.UserResponse

	err = call.GetJSON("site/auth/check", sessid, &userResponse)
	if err != nil {
		return nil, err
	}

	return userResponse.User, nil

}
