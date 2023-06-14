package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	workCommand := &cobra.Command{
		Use:   "work",
		Short: "uesio work",
		Run:   work,
	}
	workCommand.Flags().StringVarP(&name, "name", "n", "", "Name of the workspace to be set")

	rootCmd.AddCommand(workCommand)

}

func work(cmd *cobra.Command, args []string) {
	err := command.Work(name)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
