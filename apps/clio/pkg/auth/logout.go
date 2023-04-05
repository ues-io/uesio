package auth

import (
	"encoding/json"

	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
)

func Logout() (*UserMergeData, error) {

	sessid, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}

	resp, err := call.Request("POST", "site/auth/logout", nil, sessid)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	userResponse := &LoginResponse{}

	err = json.NewDecoder(resp.Body).Decode(&userResponse)
	if err != nil {
		return nil, err
	}

	return userResponse.User, config.DeleteSessionID()

}
