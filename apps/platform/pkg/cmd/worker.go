package cmd

import (
	"time"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func init() {

	rootCmd.AddCommand(&cobra.Command{
		Use:   "work",
		Short: "uesio work",
		Run:   worker,
	})

}

func worker(cmd *cobra.Command, args []string) {

	logger.Log("Running uesio worker", logger.INFO)

	for {
		usage.RunJob()
		time.Sleep(5 * time.Second)
	}

}
