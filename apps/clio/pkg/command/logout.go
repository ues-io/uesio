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

	fmt.Println("Logout Success")
	print.PrintUser(user)

	return nil

}
