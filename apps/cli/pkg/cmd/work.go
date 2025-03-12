package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	workCommand := &cobra.Command{
		Use:          "work",
		Short:        "uesio work",
		RunE:         work,
		SilenceUsage: true,
	}
	workCommand.Flags().StringVarP(&name, "name", "n", "", "Name of the workspace to be set")

	rootCmd.AddCommand(workCommand)

}

func work(cmd *cobra.Command, args []string) error {
	return command.Work(name)
}
