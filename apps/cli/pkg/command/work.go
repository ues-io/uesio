package command

import (
	"fmt"

	"github.com/thecloudmasters/cli/pkg/config/ws"
	"github.com/thecloudmasters/cli/pkg/print"
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
