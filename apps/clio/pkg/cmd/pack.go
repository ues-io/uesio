package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/clio/pkg/cmd/command"
)

var watch bool

func init() {

	packCommand := &cobra.Command{
		Use:   "pack",
		Short: "clio pack",
		Run:   packer,
	}
	packCommand.PersistentFlags().Bool("zip", false, "Also gzip packed resources")
	packCommand.Flags().BoolVarP(&watch, "watch", "w", false, "Watch for filechanges and repack")

	rootCmd.AddCommand(packCommand)

}

func packer(cmd *cobra.Command, args []string) {
	doZip, _ := cmd.Flags().GetBool("zip")
	err := command.Pack(&command.PackOptions{Zip: doZip, Watch: watch})
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
