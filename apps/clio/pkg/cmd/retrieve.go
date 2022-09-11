package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/clio/pkg/command"
)

func init() {

	checkCommand := &cobra.Command{
		Use:   "retrieve",
		Short: "clio retrieve",
		Run:   retrieve,
	}

	rootCmd.AddCommand(checkCommand)

}

func retrieve(cmd *cobra.Command, args []string) {
	err := command.Retrieve()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
