package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	logoutCommand := &cobra.Command{
		Use:          "logout",
		Short:        "uesio logout",
		RunE:         logout,
		SilenceUsage: true,
	}

	rootCmd.AddCommand(logoutCommand)

}

func logout(cmd *cobra.Command, args []string) error {
	return command.Logout()
}
