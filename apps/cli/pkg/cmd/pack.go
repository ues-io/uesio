package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/cli/pkg/command"
)

func init() {

	packCommand := &cobra.Command{
		Use:          "pack",
		Short:        "uesio pack",
		RunE:         packer,
		SilenceUsage: true,
	}
	packCommand.PersistentFlags().BoolP("zip", "z", false, "Also gzip packed resources")
	packCommand.PersistentFlags().BoolP("watch", "w", false, "Watch for filechanges and repack")
	rootCmd.AddCommand(packCommand)

}

func packer(cmd *cobra.Command, args []string) error {
	doZip, _ := cmd.Flags().GetBool("zip")
	watch, _ := cmd.Flags().GetBool("watch")
	return command.Pack(&command.PackOptions{
		Zip:   doZip,
		Watch: watch,
	})
}
