package cmd

import (
	"time"

	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func init() {

	RootCmd.AddCommand(&cobra.Command{
		Use:   "worker",
		Short: "uesio worker",
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
