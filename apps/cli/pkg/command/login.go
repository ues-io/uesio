package command

import (
	"fmt"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/print"
)

func Login() error {

	fmt.Println("Logging in...")

	user, err := auth.LoginWithOptions(true)
	if err != nil {
		return err
	}

	fmt.Println("Successfully logged in as user: " + print.PrintUserSummary(user))

	return nil
}
