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
		fmt.Println("no current session found")
		return nil
	}
	fmt.Println("successfully logged out user")
	return nil
}
