package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/clio/pkg/command"
)

func init() {

	logoutCommand := &cobra.Command{
		Use:   "logout",
		Short: "clio logout",
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
