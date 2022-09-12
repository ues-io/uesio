package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/clio/pkg/command"
)

func init() {

	checkCommand := &cobra.Command{
		Use:   "sethost",
		Short: "clio sethost",
		Run:   sethost,
	}

	rootCmd.AddCommand(checkCommand)

}

func sethost(cmd *cobra.Command, args []string) {
	err := command.SetHost()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
