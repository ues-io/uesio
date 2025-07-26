package auth

import (
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
)

func Logout() error {

	token, err := config.GetToken()
	if err != nil {
		return err
	}
	err = logoutToken(token)
	if err != nil {
		return err
	}
	return config.DeleteToken()
}

func logoutToken(token string) error {
	// If there is no current session id, there's no need to make a logout call
	if token == "" {
		return nil
	}
	resp, err := call.Post("site/auth/logout", nil, token, nil)
	if err != nil {
		return err
	}
	// intentionally ignoring
	_ = resp.Body.Close()
	return nil
}
