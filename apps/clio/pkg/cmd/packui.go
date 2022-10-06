package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/clio/pkg/command"
)

func init() {

	packCommand := &cobra.Command{
		Use:   "packui",
		Short: "clio packui",
		Run:   packui,
	}
	packCommand.PersistentFlags().BoolP("zip", "z", false, "Also gzip packed resources")
	packCommand.PersistentFlags().BoolP("watch", "w", false, "Watch for filechanges and repack")
	rootCmd.AddCommand(packCommand)

}

func packui(cmd *cobra.Command, args []string) {
	doZip, _ := cmd.Flags().GetBool("zip")
	watch, _ := cmd.Flags().GetBool("watch")
	err := command.PackUI(&command.PackOptions{
		Zip:   doZip,
		Watch: watch,
	})
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
