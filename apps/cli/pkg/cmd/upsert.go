package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	// Deprecated - use uesio workspace upsert instead
	upsertCommand := &cobra.Command{
		Use:          "upsert",
		Short:        "uesio upsert",
		RunE:         workspaceUpsert,
		SilenceUsage: true,
	}
	upsertCommand.PersistentFlags().StringP("spec", "s", "", "Filename of upsert specification")
	upsertCommand.PersistentFlags().StringP("file", "f", "", "Filename of data to upsert")
	upsertCommand.PersistentFlags().StringP("collection", "c", "", "The collection to upsert")

	rootCmd.AddCommand(upsertCommand)

}

func workspaceUpsert(cmd *cobra.Command, args []string) error {
	spec, _ := cmd.Flags().GetString("spec")
	file, _ := cmd.Flags().GetString("file")
	collection, _ := cmd.Flags().GetString("collection")

	return command.UpsertToWorkspace(&command.UpsertOptions{
		SpecFile:   spec,
		DataFile:   file,
		Collection: collection,
	})
}
