package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/clio/pkg/command"
)

func init() {

	deployCommand := &cobra.Command{
		Use:   "deploy",
		Short: "clio deploy",
		Run:   deploy,
	}

	rootCmd.AddCommand(deployCommand)

}

func deploy(cmd *cobra.Command, args []string) {
	err := command.Deploy()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
