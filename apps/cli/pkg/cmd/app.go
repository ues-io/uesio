package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command/app"
)

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

	appCommand.AddCommand(appInitCommand, appCloneCommand)

	// DEPRECATED COMMANDS
	oldInitCommand := &cobra.Command{
		Use:   "init",
		Short: "uesio init",
		Run:   appInit,
	}

	rootCmd.AddCommand(appCommand, oldInitCommand)

}

func appInit(cmd *cobra.Command, args []string) {
	err := app.AppInit()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}

func appClone(cmd *cobra.Command, args []string) {
	err := app.AppClone()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
