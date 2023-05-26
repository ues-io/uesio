package command

import (
	"fmt"
	"github.com/thecloudmasters/cli/pkg/config/ws"
)

func Work(workspaceName string) error {

	if workspaceName == "" {
		workspacePrompt, err := ws.SetWorkspacePrompt("")
		if err != nil {
			return err
		}
		workspaceName = workspacePrompt
	}

	err := ws.SetWorkspace(workspaceName)
	if err != nil {
		return err
	}

	fmt.Printf("Active workspace updated to: %s\n", workspaceName)

	return nil
}
