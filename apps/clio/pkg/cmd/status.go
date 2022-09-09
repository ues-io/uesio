package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/clio/pkg/command"
)

func init() {

	checkCommand := &cobra.Command{
		Use:   "status",
		Short: "clio status",
		Run:   status,
	}

	rootCmd.AddCommand(checkCommand)

}

func status(cmd *cobra.Command, args []string) {
	err := command.Status()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
