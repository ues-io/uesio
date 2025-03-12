package cmd

import (
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
		Use:          "retrieve",
		Short:        "Retrieves all workspace metadata",
		Long:         "Retrieves all metadata from a remote workspace to the local directory",
		RunE:         workspaceRetrieve,
		SilenceUsage: true,
	}
	workspaceRetrieveCmd.Flags().Bool("onlyTypes", false, "Only retrieve types")

	workspaceDeployCmd := &cobra.Command{
		Use:          "deploy",
		Short:        "Deploys all metadata to a workspace",
		Long:         "Deploys all local metadata to a remote workspace",
		RunE:         workspaceDeploy,
		SilenceUsage: true,
	}

	workspaceCreateCmd := &cobra.Command{
		Use:          "create",
		Short:        "Create a new workspace",
		Long:         "Creates a new workspace in the Uesio studio for the context app",
		RunE:         workspaceCreate,
		SilenceUsage: true,
	}
	workspaceCreateCmd.Flags().StringVarP(&name, "name", "n", "", "Name for new workspace")

	workspaceTruncateCmd := &cobra.Command{
		Use:          "truncate",
		Short:        "Delete all data in the workspace",
		Long:         "Deletes all data from all collections in the current workspace",
		RunE:         workspaceTruncate,
		SilenceUsage: true,
	}

	workspaceDeleteCmd := &cobra.Command{
		Use:          "delete",
		Short:        "Deletes a workspace",
		Long:         "Deletes a workspace, and all data in all collections in the specified workspace",
		RunE:         workspaceDelete,
		SilenceUsage: true,
	}
	workspaceDeleteCmd.Flags().StringVarP(&name, "name", "n", "", "Name of workspace to delete")

	workspaceCommand.AddCommand(workspaceCreateCmd, workspaceDeployCmd, workspaceRetrieveCmd, workspaceTruncateCmd, workspaceDeleteCmd)

	//
	// convenience aliases for retrieve and deploy
	//
	oldDeployCommand := &cobra.Command{
		Use:          "deploy",
		Short:        "uesio deploy",
		RunE:         workspaceDeploy,
		SilenceUsage: true,
	}
	oldRetrieveCommand := &cobra.Command{
		Use:          "retrieve",
		Short:        "uesio retrieve",
		RunE:         workspaceRetrieve,
		SilenceUsage: true,
	}
	oldRetrieveCommand.Flags().Bool("onlyTypes", false, "Only retrieve types")

	rootCmd.AddCommand(workspaceCommand, oldDeployCommand, oldRetrieveCommand)

}

func workspaceRetrieve(cmd *cobra.Command, args []string) error {
	onlyTypes, _ := cmd.Flags().GetBool("onlyTypes")
	return workspace.Retrieve(&workspace.RetrieveOptions{
		OnlyTypes: onlyTypes,
	})
}

func workspaceDeploy(cmd *cobra.Command, args []string) error {
	return workspace.Deploy()
}

func workspaceCreate(cmd *cobra.Command, args []string) error {
	return workspace.Create(name)
}

func workspaceTruncate(cmd *cobra.Command, args []string) error {
	return workspace.Truncate()
}

func workspaceDelete(cmd *cobra.Command, args []string) error {
	return workspace.Delete(name)
}
