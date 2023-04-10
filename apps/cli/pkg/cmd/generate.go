package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	generateCommand := &cobra.Command{
		Use:   "generate",
		Short: "uesio generate",
		Run:   generate,
	}

	rootCmd.AddCommand(generateCommand)

}

func generate(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		fmt.Println("Error: Must provide a generator")
		return
	}
	err := command.Generate(args[0])
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
