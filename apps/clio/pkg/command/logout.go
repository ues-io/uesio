package command

import (
	"fmt"

	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/print"
)

func Logout() error {

	fmt.Println("Running Logout Command")

	user, err := auth.Logout()
	if err != nil {
		return err
	}

	if user == nil {
		fmt.Println("No current session found")
		return nil
	}
	fmt.Println("Successfully logged out user: " + print.PrintUserSummary(user))

	return nil

}
