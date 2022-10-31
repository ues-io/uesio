package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/clio/pkg/command"
)

func init() {

	initCommand := &cobra.Command{
		Use:   "init",
		Short: "clio init",
		Run:   initialize,
	}

	rootCmd.AddCommand(initCommand)

}

func initialize(cmd *cobra.Command, args []string) {
	err := command.Initialize()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
