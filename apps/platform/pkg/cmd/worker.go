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
		err := usage.RunJob()
		if err != nil {
			logger.Log("Job failed reason: "+err.Error(), logger.ERROR)
		}
		logger.Log("Job completed without any issues", logger.INFO)
		time.Sleep(5 * time.Second)
	}

}
