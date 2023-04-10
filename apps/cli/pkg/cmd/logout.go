package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	logoutCommand := &cobra.Command{
		Use:   "logout",
		Short: "uesio logout",
		Run:   logout,
	}

	rootCmd.AddCommand(logoutCommand)

}

func logout(cmd *cobra.Command, args []string) {
	err := command.Logout()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
