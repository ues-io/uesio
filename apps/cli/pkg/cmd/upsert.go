package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	upsertCommand := &cobra.Command{
		Use:   "upsert",
		Short: "uesio upsert",
		Run:   upsert,
	}
	upsertCommand.PersistentFlags().StringP("spec", "s", "", "Filename of upsert specification")
	upsertCommand.PersistentFlags().StringP("file", "f", "", "Filename of data to upsert")
	upsertCommand.PersistentFlags().StringP("collection", "c", "", "The collection to upsert")

	rootCmd.AddCommand(upsertCommand)

}

func upsert(cmd *cobra.Command, args []string) {
	spec, _ := cmd.Flags().GetString("spec")
	file, _ := cmd.Flags().GetString("file")
	collection, _ := cmd.Flags().GetString("collection")

	err := command.Upsert(&command.UpsertOptions{
		SpecFile:   spec,
		DataFile:   file,
		Collection: collection,
	})
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
