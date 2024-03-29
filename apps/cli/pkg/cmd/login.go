package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	loginCommand := &cobra.Command{
		Use:   "login",
		Short: "uesio login",
		Run:   login,
	}

	rootCmd.AddCommand(loginCommand)

}

func login(cmd *cobra.Command, args []string) {
	err := command.Login()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
