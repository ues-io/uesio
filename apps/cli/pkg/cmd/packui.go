package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {
	// Don't register the packui command unless we are in Uesio dev mode,
	// as this command is only needed for development of the "ui" module
	if os.Getenv("UESIO_DEV") != "true" {
		return
	}
	packCommand := &cobra.Command{
		Use:   "packui",
		Short: "uesio packui",
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
