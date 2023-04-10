package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	setHostCommand := &cobra.Command{
		Use:   "sethost",
		Short: "uesio sethost",
		Run:   sethost,
	}

	rootCmd.AddCommand(setHostCommand)

}

func sethost(cmd *cobra.Command, args []string) {
	err := command.SetHost()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
