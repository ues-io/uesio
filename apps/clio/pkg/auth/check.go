package auth

import (
	"encoding/json"

	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/uesio/pkg/routing"
)

func Check() (*routing.UserMergeData, error) {

	sessid, err := config.GetSessionID()
	if err != nil {
		return nil, err
	}

	resp, err := call.Request("GET", "site/auth/check", nil, sessid)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	userResponse := &routing.LoginResponse{}

	err = json.NewDecoder(resp.Body).Decode(&userResponse)
	if err != nil {
		return nil, err
	}

	return userResponse.User, nil

}
