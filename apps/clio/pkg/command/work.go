package command

import (
	"fmt"

	"github.com/thecloudmasters/clio/pkg/config/ws"
	"github.com/thecloudmasters/clio/pkg/print"
)

func Work() error {

	fmt.Println("Running Set Workspace Command")

	workspace, err := ws.SetWorkspacePrompt()
	if err != nil {
		return err
	}

	fmt.Println("Successfully Set Workspace")
	print.PrintWorkspace(workspace)

	return nil
}
