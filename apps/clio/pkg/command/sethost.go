package command

import (
	"fmt"

	"github.com/thecloudmasters/clio/pkg/config/host"
	"github.com/thecloudmasters/clio/pkg/print"
)

func SetHost() error {

	fmt.Println("Running Set Host Command")

	host, err := host.SetHostPrompt()
	if err != nil {
		return err
	}

	fmt.Println("Successfully Set Host")
	print.PrintHost(host)

	return nil
}
