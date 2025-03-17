package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	setHostCommand := &cobra.Command{
		Use:          "sethost",
		Short:        "uesio sethost",
		RunE:         sethost,
		SilenceUsage: true,
	}

	rootCmd.AddCommand(setHostCommand)

}

func sethost(cmd *cobra.Command, args []string) error {
	return command.SetHost()
}
