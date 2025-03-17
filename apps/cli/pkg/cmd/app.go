package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command/app"
)

var targetDir string

func init() {

	// Add "app" prefix command
	appCommand := &cobra.Command{
		Use:   "app",
		Short: "All app-related commands",
	}

	appInitCommand := &cobra.Command{
		Use:          "init",
		Short:        "Scaffolds a new Uesio app locally",
		Long:         "Scaffolds a new Uesio app in the current directory",
		RunE:         appInit,
		SilenceUsage: true,
	}

	appCloneCommand := &cobra.Command{
		Use:          "clone",
		Short:        "Fetches an app's metadata from the Uesio studio",
		Long:         "Fetches an app's metadata from the Uesio studio and sets up a local project",
		RunE:         appClone,
		SilenceUsage: true,
	}
	appCloneCommand.Flags().StringVarP(&targetDir, "dir", "d", "", "Directory to clone into. Defaults to current directory")

	appDeleteCmd := &cobra.Command{
		Use:          "delete",
		Short:        "Deletes an app from the selected uesio server",
		Long:         "Deletes an app, and all data in all workspaces in the specified app",
		RunE:         appDelete,
		SilenceUsage: true,
	}
	appDeleteCmd.Flags().StringVarP(&name, "name", "n", "", "Name of app to delete")

	appCommand.AddCommand(appInitCommand, appCloneCommand, appDeleteCmd)

	rootCmd.AddCommand(appCommand)

}

func appInit(cmd *cobra.Command, args []string) error {
	return app.AppInit()
}

func appClone(cmd *cobra.Command, args []string) error {
	return app.AppClone(targetDir)
}

func appDelete(cmd *cobra.Command, args []string) error {
	return app.Delete(name)
}
