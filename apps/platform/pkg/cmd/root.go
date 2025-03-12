package cmd

import (
	"github.com/spf13/cobra"
)

// RootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:           "Uesio",
	Short:         "User Experience Studio",
	SilenceErrors: true,
}

// Execute is used as entrypoint to the cobra commands
func Execute() error {
	return rootCmd.Execute()
}
