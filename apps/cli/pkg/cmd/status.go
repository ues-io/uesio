package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	statusCommand := &cobra.Command{
		Use:   "status",
		Short: "uesio status",
		Run:   status,
	}

	rootCmd.AddCommand(statusCommand)

}

func status(cmd *cobra.Command, args []string) {
	err := command.Status()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
