package auth

import (
	"encoding/json"

	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/preload"
)

func Logout() (*preload.UserMergeData, error) {

	token, err := config.GetToken()
	if err != nil {
		return nil, err
	}
	// If there is no current session id, there's no need to make a logout call
	if token == "" {
		return nil, nil
	}
	resp, err := call.Post("site/auth/logout", nil, token, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var userResponse auth.LoginResponse

	if err = json.NewDecoder(resp.Body).Decode(&userResponse); err != nil {
		return nil, err
	}

	return userResponse.User, config.DeleteToken()

}
