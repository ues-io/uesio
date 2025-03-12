package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	loginCommand := &cobra.Command{
		Use:          "login",
		Short:        "uesio login",
		RunE:         login,
		SilenceUsage: true,
	}

	rootCmd.AddCommand(loginCommand)

}

func login(cmd *cobra.Command, args []string) error {
	return command.Login()
}
