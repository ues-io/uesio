package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command/workspace"
)

var name string

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
	workspaceRetrieveCmd.Flags().StringVarP(&targetDir, "dir", "d", "", "Directory to retrieve into. Defaults to current directory")

	workspaceDeployCmd := &cobra.Command{
		Use:   "deploy",
		Short: "Deploys all metadata to a workspace",
		Long:  "Deploys all local metadata to a remote workspace",
		Run:   workspaceDeploy,
	}
	workspaceDeployCmd.Flags().StringVarP(&targetDir, "dir", "d", "", "Directory to deploy from. Defaults to current directory")

	workspaceCreateCmd := &cobra.Command{
		Use:   "create",
		Short: "Create a new workspace",
		Long:  "Creates a new workspace in the Uesio studio for the context app",
		Run:   workspaceCreate,
	}
	workspaceCreateCmd.Flags().StringVarP(&name, "name", "n", "", "Name for new workspace")

	workspaceCommand.AddCommand(workspaceCreateCmd, workspaceDeployCmd, workspaceRetrieveCmd)

	//
	// DEPRECATED aliases for retrieve and deploy
	//
	oldDeployCommand := &cobra.Command{
		Use:   "deploy",
		Short: "uesio deploy",
		Run:   workspaceDeploy,
	}
	oldDeployCommand.Flags().StringVarP(&targetDir, "dir", "d", "", "Directory to deploy from. Defaults to current directory")
	oldRetrieveCommand := &cobra.Command{
		Use:   "retrieve",
		Short: "uesio retrieve",
		Run:   workspaceRetrieve,
	}
	oldRetrieveCommand.Flags().StringVarP(&targetDir, "dir", "d", "", "Directory to retrieve into. Defaults to current directory")

	rootCmd.AddCommand(workspaceCommand, oldDeployCommand, oldRetrieveCommand)

}

func workspaceRetrieve(cmd *cobra.Command, args []string) {
	err := workspace.Retrieve(targetDir)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}

func workspaceDeploy(cmd *cobra.Command, args []string) {
	err := workspace.Deploy(targetDir)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}

func workspaceCreate(cmd *cobra.Command, args []string) {
	err := workspace.Create(name)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
