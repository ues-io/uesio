package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	packCommand := &cobra.Command{
		Use:   "pack",
		Short: "uesio pack",
		Run:   packer,
	}
	packCommand.PersistentFlags().BoolP("zip", "z", false, "Also gzip packed resources")
	packCommand.PersistentFlags().BoolP("watch", "w", false, "Watch for filechanges and repack")
	rootCmd.AddCommand(packCommand)

}

func packer(cmd *cobra.Command, args []string) {
	doZip, _ := cmd.Flags().GetBool("zip")
	watch, _ := cmd.Flags().GetBool("watch")
	err := command.Pack(&command.PackOptions{
		Zip:   doZip,
		Watch: watch,
	})
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
