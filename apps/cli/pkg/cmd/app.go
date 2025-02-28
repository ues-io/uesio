package cmd

import (
	"fmt"
	"os"

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
		Use:   "init",
		Short: "Scaffolds a new Uesio app locally",
		Long:  "Scaffolds a new Uesio app in the current directory",
		Run:   appInit,
	}

	appCloneCommand := &cobra.Command{
		Use:   "clone",
		Short: "Fetches an app's metadata from the Uesio studio",
		Long:  "Fetches an app's metadata from the Uesio studio and sets up a local project",
		Run:   appClone,
	}
	appCloneCommand.Flags().StringVarP(&targetDir, "dir", "d", "", "Directory to clone into. Defaults to current directory")

	appDeleteCmd := &cobra.Command{
		Use:   "delete",
		Short: "Deletes an app from the selected uesio server",
		Long:  "Deletes an app, and all data in all workspaces in the specified app",
		Run:   appDelete,
	}
	appDeleteCmd.Flags().StringVarP(&name, "name", "n", "", "Name of app to delete")

	appCommand.AddCommand(appInitCommand, appCloneCommand, appDeleteCmd)

	rootCmd.AddCommand(appCommand)

}

func appInit(cmd *cobra.Command, args []string) {
	err := app.AppInit()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}

func appClone(cmd *cobra.Command, args []string) {
	err := app.AppClone(targetDir)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}

func appDelete(cmd *cobra.Command, args []string) {
	err := app.Delete(name)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		os.Exit(1)
		return
	}
}
