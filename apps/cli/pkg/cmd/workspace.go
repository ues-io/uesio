package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command/workspace"
)

func init() {

	// Add "workspace" prefix command
	workspaceCommand := &cobra.Command{
		Use:   "workspace",
		Short: "All workspace related commands",
	}

	// Add sub-commands
	workspaceRetrieveCmd := &cobra.Command{
		Use:   "retrieve",
		Short: "Retrieves all workspace metadata",
		Long:  "Retrieves all metadata from a remote workspace to the local directory",
		Run:   workspaceRetrieve,
	}
	workspaceDeployCmd := &cobra.Command{
		Use:   "deploy",
		Short: "Deploys all metadata to a workspace",
		Long:  "Deploys all local metadata to a remote workspace",
		Run:   workspaceDeploy,
	}
	workspaceCommand.AddCommand(workspaceRetrieveCmd, workspaceDeployCmd)

	//
	// DEPRECATED aliases for retrieve and deploy
	//
	oldDeployCommand := &cobra.Command{
		Use:   "deploy",
		Short: "uesio deploy",
		Run:   workspaceDeploy,
	}
	oldRetrieveCommand := &cobra.Command{
		Use:   "retrieve",
		Short: "uesio retrieve",
		Run:   workspaceRetrieve,
	}

	rootCmd.AddCommand(workspaceCommand, oldDeployCommand, oldRetrieveCommand)

}

func workspaceRetrieve(cmd *cobra.Command, args []string) {
	err := workspace.Retrieve()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}

func workspaceDeploy(cmd *cobra.Command, args []string) {
	err := workspace.Deploy()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
