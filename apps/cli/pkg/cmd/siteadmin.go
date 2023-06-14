package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	workCommand := &cobra.Command{
		Use:   "siteadmin",
		Short: "uesio siteadmin",
		Run:   siteadmin,
	}
	workCommand.Flags().StringVarP(&name, "name", "n", "", "Name of the site to be set")

	rootCmd.AddCommand(workCommand)

}

func siteadmin(cmd *cobra.Command, args []string) {
	err := command.SiteAdmin(name)
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
