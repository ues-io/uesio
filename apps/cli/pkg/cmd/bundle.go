package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command/bundle"
)

func init() {

	bundleCommand := &cobra.Command{
		Use:   "bundle",
		Short: "Manage app bundles",
	}

	createBundleCommand := &cobra.Command{
		Use:   "create",
		Short: "Create a new bundle using the contents of the current workspace",
		Run:   createBundle,
	}

	bundleCommand.AddCommand(createBundleCommand)

	rootCmd.AddCommand(bundleCommand)

}

func createBundle(cmd *cobra.Command, args []string) {
	err := bundle.CreateBundle()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
