package cmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
	"github.com/thecloudmasters/cli/pkg/goutils"
)

func init() {

	generateCommand := &cobra.Command{
		Use:   "generate",
		Short: "Create new metadata using a guided wizard",
		Run:   generate,
	}

	rootCmd.AddCommand(generateCommand)

}

// TODO: For now a static list is simpler and faster,
// but eventually we should retrieve a list of valid generators from the server
var validGenerators = map[string]bool{
	"collection":    true,
	"component":     true,
	"componentpack": true,
	"field":         true,
	"theme":         true,
	"route":         true,
	"view":          true,
	"listview":      true,
	"detailview":    true,
}

func generate(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		fmt.Println("Error: Must provide a generator")
		return
	}

	if !validGenerators[args[0]] {
		fmt.Println("Error: Invalid generator. Valid values are: " + strings.Join(goutils.MapKeys(validGenerators), ", "))
		return
	}

	err := command.Generate(args[0])
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
