package command

import (
	"fmt"

	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/clio/pkg/print"
)

func Status() error {

	fmt.Println("Running Status Command")

	user, err := auth.Check()
	if err != nil {
		return err
	}

	host, err := config.GetHost()
	if err != nil {
		return err
	}

	print.PrintHost(host)
	print.PrintUser(user)

	return nil
}
