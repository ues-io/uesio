package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
	"github.com/thecloudmasters/cli/pkg/command/site"
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

func siteDeploy(cmd *cobra.Command, args []string) {
	siteName, _ := cmd.Flags().GetString("site")
	newBundleVersion, _ := cmd.Flags().GetString("bundle")

	if siteName == "" {
		fmt.Println("site name is required")
		return
	}
	if newBundleVersion == "" {
		fmt.Println("bundle is required")
		return
	}

	err := site.SiteDeploy(siteName, newBundleVersion)
	if err != nil {
		fmt.Println("Unable to deploy site: " + err.Error())
		return
	}
	fmt.Printf("Successfully updated site %s to bundle version: %s\n", siteName, newBundleVersion)
}

func init() {

	// Add "site" prefix command
	siteCommand := &cobra.Command{
		Use:   "site",
		Short: "All site related commands",
	}

	// Add sub-commands

	siteDeployCommand := &cobra.Command{
		Use:   "deploy",
		Short: "Update a site's associated bundle version",
		Long:  "Updates a site's bundle to a specified version",
		Run:   siteDeploy,
	}
	siteDeployCommand.PersistentFlags().StringP("bundle", "b", "", "The bundle version")
	siteDeployCommand.PersistentFlags().StringP("site", "s", "", "The site name")

	siteUpsertCmd := &cobra.Command{
		Use:   "upsert",
		Short: "Upserts data to a site",
		Long:  "Upserts data from a local directory to a site",
		Run:   siteUpsert,
	}
	siteUpsertCmd.PersistentFlags().StringP("spec", "s", "", "Filename of upsert specification")
	siteUpsertCmd.PersistentFlags().StringP("file", "f", "", "Filename of data to upsert")
	siteUpsertCmd.PersistentFlags().StringP("collection", "c", "", "The collection to upsert")

	siteCommand.AddCommand(siteDeployCommand, siteUpsertCmd)
	rootCmd.AddCommand(siteCommand)

}
