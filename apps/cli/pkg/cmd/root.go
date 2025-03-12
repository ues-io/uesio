package cmd

import (
	"github.com/spf13/cobra"
)

// RootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "uesio",
	Short: "The Uesio CLI",
}

// Execute is used as entrypoint to the cobra commands
func Execute() error {
	return rootCmd.Execute()
}
