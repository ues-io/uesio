package command

import (
	"fmt"

	"github.com/thecloudmasters/cli/pkg/auth"
)

func Logout() error {

	err := auth.Logout()
	if err != nil {
		return err
	}

	fmt.Println("successfully logged out user")
	return nil
}
