package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	siteAdminCommand := &cobra.Command{
		Use:   "siteadmin",
		Short: "Set the name of the context site",
		Long:  "Updates your local configuration to set name of the context site",
		Run:   siteAdminCmd,
	}
	siteAdminCommand.Flags().StringVarP(&name, "name", "n", "", "Name of the site to be set")

	rootCmd.AddCommand(siteAdminCommand)

}

func siteAdminCmd(cmd *cobra.Command, args []string) {
	err := command.SiteAdmin(name)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
