package command

import (
	"fmt"

	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/print"
)

func Login() error {

	fmt.Println("Running Login Command")

	user, err := auth.Login()
	if err != nil {
		return err
	}

	fmt.Println("Login Success")
	print.PrintUser(user)

	return nil
}
