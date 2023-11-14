package auth

import (
	"encoding/json"

	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
)

func Logout() (*UserMergeData, error) {

	sessionId, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}
	// If there is no current session id, there's no need to make a logout call
	if sessionId == "" {
		return nil, nil
	}
	resp, err := call.Request("POST", "site/auth/logout", nil, sessionId, nil)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	userResponse := &LoginResponse{}

	if err = json.NewDecoder(resp.Body).Decode(&userResponse); err != nil {
		return nil, err
	}

	return userResponse.User, config.DeleteSessionID()

}
