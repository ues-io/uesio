package cmd

import (
	"log/slog"
	"os"

	"github.com/spf13/cobra"
)

// RootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "Uesio",
	Short: "User Experience Studio",
}

// Execute is used as entrypoint to the cobra commands
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		slog.Error(err.Error())
		os.Exit(-1)
	}
}
