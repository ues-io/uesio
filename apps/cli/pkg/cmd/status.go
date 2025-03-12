package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	statusCommand := &cobra.Command{
		Use:          "status",
		Short:        "uesio status",
		RunE:         status,
		SilenceUsage: true,
	}

	rootCmd.AddCommand(statusCommand)

}

func status(cmd *cobra.Command, args []string) error {
	return command.Status()
}
