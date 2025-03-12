package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command/bundle"
)

var releaseType, majorVersion, minorVersion, patchVersion, bundleDescription string

func init() {

	bundleCommand := &cobra.Command{
		Use:   "bundle",
		Short: "Manage app bundles",
	}

	createBundleCommand := &cobra.Command{
		Use:          "create",
		Short:        "Create a new bundle using the contents of the current workspace",
		RunE:         createBundle,
		SilenceUsage: true,
	}
	createBundleCommand.Flags().StringVarP(&bundleDescription, "description", "d", "", "Text describing this bundle")
	createBundleCommand.Flags().StringVarP(&releaseType, "type", "t", "", "The release type, one of ['major','minor','patch','custom']")
	createBundleCommand.Flags().StringVarP(&majorVersion, "major", "m", "", "The major release number for this bundle")
	createBundleCommand.Flags().StringVarP(&minorVersion, "minor", "n", "", "The minor release number for this bundle")
	createBundleCommand.Flags().StringVarP(&patchVersion, "patch", "p", "", "The patch release number for this bundle")

	bundleCommand.AddCommand(createBundleCommand)

	rootCmd.AddCommand(bundleCommand)

}

func createBundle(cmd *cobra.Command, args []string) error {
	return bundle.CreateBundle(releaseType, majorVersion, minorVersion, patchVersion, bundleDescription)
}
