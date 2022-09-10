package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/clio/pkg/command"
)

func init() {

	checkCommand := &cobra.Command{
		Use:   "work",
		Short: "clio work",
		Run:   work,
	}

	rootCmd.AddCommand(checkCommand)

}

func work(cmd *cobra.Command, args []string) {
	err := command.Work()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
