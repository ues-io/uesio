package cmd

import (
	"os"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/logger"
)

// RootCmd represents the base command when called without any subcommands
var RootCmd = &cobra.Command{
	Use:   "Uesio",
	Short: "User Experience Studio",
}

// Execute is used as entrypoint to the cobra commands
func Execute() {
	if err := RootCmd.Execute(); err != nil {
		logger.LogError(err)
		os.Exit(-1)
	}
}
