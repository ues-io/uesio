package command

import (
	"fmt"

	"github.com/thecloudmasters/clio/pkg/config"
)

func SetHost() error {

	fmt.Println("Running Set Host Command")

	host, err := config.SetHostPrompt()
	if err != nil {
		return err
	}

	fmt.Println("Successfully Set Host")
	fmt.Println(host)

	return nil
}
