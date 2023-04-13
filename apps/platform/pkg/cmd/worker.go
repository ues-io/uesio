package cmd

import (
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/worker"
)

func init() {
	rootCmd.AddCommand(&cobra.Command{
		Use:   "worker",
		Short: "Runs Uesio worker jobs",
		Long:  "Sets up a scheduler to run all Uesio worker jobs as needed, e.g. usage event aggregation every minute, invoicing jobs every day",
		Run:   runJobs,
	})
}

func runJobs(*cobra.Command, []string) {
	logger.Log("Running Uesio worker process", logger.INFO)
	worker.ScheduleJobs()
}
