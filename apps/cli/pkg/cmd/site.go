package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func siteUpsert(cmd *cobra.Command, args []string) {
	spec, _ := cmd.Flags().GetString("spec")
	file, _ := cmd.Flags().GetString("file")
	collection, _ := cmd.Flags().GetString("collection")

	err := command.UpsertToSite(&command.UpsertOptions{
		SpecFile:   spec,
		DataFile:   file,
		Collection: collection,
	})
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}

func init() {

	// Add "site" prefix command
	siteCommand := &cobra.Command{
		Use:   "site",
		Short: "All site related commands",
	}

	// Add sub-commands
	siteUpsertCmd := &cobra.Command{
		Use:   "upsert",
		Short: "Upserts data to a site",
		Long:  "Upserts data from a local directory to a site",
		Run:   siteUpsert,
	}
	siteUpsertCmd.PersistentFlags().StringP("spec", "s", "", "Filename of upsert specification")
	siteUpsertCmd.PersistentFlags().StringP("file", "f", "", "Filename of data to upsert")
	siteUpsertCmd.PersistentFlags().StringP("collection", "c", "", "The collection to upsert")

	siteCommand.AddCommand(siteUpsertCmd)
	rootCmd.AddCommand(siteCommand)

}
