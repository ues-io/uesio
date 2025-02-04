package cmd

import (
	"fmt"
	"os"

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
	workspaceRetrieveCmd.Flags().BoolP("onlyTypes", "t", false, "Only retrieve types")

	workspaceDeployCmd := &cobra.Command{
		Use:   "deploy",
		Short: "Deploys all metadata to a workspace",
		Long:  "Deploys all local metadata to a remote workspace",
		Run:   workspaceDeploy,
	}

	workspaceCreateCmd := &cobra.Command{
		Use:   "create",
		Short: "Create a new workspace",
		Long:  "Creates a new workspace in the Uesio studio for the context app",
		Run:   workspaceCreate,
	}
	workspaceCreateCmd.Flags().StringVarP(&name, "name", "n", "", "Name for new workspace")

	workspaceTruncateCmd := &cobra.Command{
		Use:   "truncate",
		Short: "Delete all data in the workspace",
		Long:  "Deletes all data from all collections in the current workspace",
		Run:   workspaceTruncate,
	}

	workspaceDeleteCmd := &cobra.Command{
		Use:   "delete",
		Short: "Deletes a workspace",
		Long:  "Deletes a workspace, and all data in all collections in the specified workspace",
		Run:   workspaceDelete,
	}
	workspaceDeleteCmd.Flags().StringVarP(&name, "name", "n", "", "Name of workspace to delete")

	workspaceCommand.AddCommand(workspaceCreateCmd, workspaceDeployCmd, workspaceRetrieveCmd, workspaceTruncateCmd, workspaceDeleteCmd)

	//
	// convenience aliases for retrieve and deploy
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
	oldRetrieveCommand.Flags().BoolP("onlyTypes", "t", false, "Only retrieve types")

	rootCmd.AddCommand(workspaceCommand, oldDeployCommand, oldRetrieveCommand)

}

func workspaceRetrieve(cmd *cobra.Command, args []string) {
	onlyTypes, _ := cmd.Flags().GetBool("onlyTypes")
	err := workspace.Retrieve(&workspace.RetrieveOptions{
		OnlyTypes: onlyTypes,
	})
	if err != nil {
		fmt.Println("Error: " + err.Error())
		os.Exit(1)
		return
	}
}

func workspaceDeploy(cmd *cobra.Command, args []string) {
	err := workspace.Deploy()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		os.Exit(1)
		return
	}
}

func workspaceCreate(cmd *cobra.Command, args []string) {
	err := workspace.Create(name)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		os.Exit(1)
		return
	}
}

func workspaceTruncate(cmd *cobra.Command, args []string) {
	err := workspace.Truncate()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		os.Exit(1)
		return
	}
}

func workspaceDelete(cmd *cobra.Command, args []string) {
	err := workspace.Delete(name)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		os.Exit(1)
		return
	}
}
