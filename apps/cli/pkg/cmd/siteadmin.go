package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	siteAdminCommand := &cobra.Command{
		Use:          "siteadmin",
		Short:        "Set the name of the context site",
		Long:         "Updates your local configuration to set name of the context site",
		RunE:         siteAdminCmd,
		SilenceUsage: true,
	}
	siteAdminCommand.Flags().StringVarP(&name, "name", "n", "", "Name of the site to be set")

	rootCmd.AddCommand(siteAdminCommand)

}

func siteAdminCmd(cmd *cobra.Command, args []string) error {
	return command.SiteAdmin(name)
}
