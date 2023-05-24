package command

import (
	"fmt"

	"github.com/thecloudmasters/cli/pkg/config/ws"
	"github.com/thecloudmasters/cli/pkg/print"
)

func Work(workspace string) error {

	fmt.Println("Running Set Workspace Command")

	if workspace == "" {
		workspacePromt, err := ws.SetWorkspacePrompt("")
		if err != nil {
			return err
		}
		workspace = workspacePromt
	}

	_, err := ws.SetWorkspaceByID("", workspace)
	if err != nil {
		return err
	}

	fmt.Println("Successfully set Workspace")
	print.PrintWorkspace(workspace)

	return nil
}
