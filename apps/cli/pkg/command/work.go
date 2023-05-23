package command

import (
	"fmt"

	"github.com/thecloudmasters/cli/pkg/config/ws"
	"github.com/thecloudmasters/cli/pkg/print"
)

func Work(workspaceName string) error {

	fmt.Println("Running Set Workspace Command")

	workspace := workspaceName
	if workspaceName == "" {
		workspacePromt, err := ws.SetWorkspacePrompt("")
		if err != nil {
			return err
		}
		workspace = workspacePromt
	}

	fmt.Println("Successfully set Workspace")
	print.PrintWorkspace(workspace)

	return nil
}
