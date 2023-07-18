package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
	"github.com/thecloudmasters/cli/pkg/command/site"
	"github.com/thecloudmasters/cli/pkg/config/siteadmin"
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

func siteUse(cmd *cobra.Command, args []string) {
	siteName, _ := cmd.Flags().GetString("name")
	newBundleVersion, _ := cmd.Flags().GetString("bundle")

	// If site name is not provided, see if a siteadmin context has been set
	if siteName == "" {
		configSiteName, err := siteadmin.GetSiteAdmin()
		if err == nil && configSiteName != "" {
			siteName = configSiteName
		} else {
			fmt.Println("site name is required")
			return
		}
	}
	if newBundleVersion == "" {
		fmt.Println("bundle is required")
		return
	}

	err := site.UseBundle(siteName, newBundleVersion)
	if err != nil {
		fmt.Println("Unable to update site to use the requested bundle: " + err.Error())
		return
	}
	fmt.Printf("Successfully updated site %s to use bundle: %s\n", siteName, newBundleVersion)
}

func init() {

	// Add "site" prefix command
	siteCommand := &cobra.Command{
		Use:   "site",
		Short: "All site related commands",
	}

	// Add sub-commands

	siteUseCommand := &cobra.Command{
		Use:   "use",
		Short: "Use a different bundle for a site",
		Long:  "Switches a site to use a different bundle",
		Run:   siteUse,
	}
	siteUseCommand.PersistentFlags().StringP("bundle", "b", "", "The bundle to use")
	siteUseCommand.PersistentFlags().StringP("name", "n", "", "The site name")

	siteUpsertCmd := &cobra.Command{
		Use:   "upsert",
		Short: "Upserts data to a site",
		Long:  "Upserts data from a local directory to a site",
		Run:   siteUpsert,
	}
	siteUpsertCmd.PersistentFlags().StringP("spec", "s", "", "Filename of upsert specification")
	siteUpsertCmd.PersistentFlags().StringP("file", "f", "", "Filename of data to upsert")
	siteUpsertCmd.PersistentFlags().StringP("collection", "c", "", "The collection to upsert")

	siteCommand.AddCommand(siteUseCommand, siteUpsertCmd)
	rootCmd.AddCommand(siteCommand)

}
