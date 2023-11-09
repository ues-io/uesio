package command

import (
	"fmt"

	"github.com/thecloudmasters/cli/pkg/auth"
)

func Logout() error {

	user, err := auth.Logout()
	if err != nil {
		return err
	}

	if user == nil {
		fmt.Println("No current session found")
		return nil
	}
	fmt.Println("Successfully logged out user")
	return nil
}
