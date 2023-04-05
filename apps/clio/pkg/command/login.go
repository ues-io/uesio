package command

import (
	"fmt"

	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/print"
)

func Login() error {

	fmt.Println("Logging in...")

	user, err := auth.Login()
	if err != nil {
		return err
	}

	fmt.Println("Successfully logged in as user: " + print.PrintUserSummary(user))

	return nil
}
