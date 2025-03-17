package cmd

import (
	"log/slog"

	"github.com/spf13/cobra"

	"github.com/thecloudmasters/uesio/pkg/worker"
)

func init() {
	rootCmd.AddCommand(&cobra.Command{
		Use:          "worker",
		Short:        "Runs Uesio worker jobs",
		Long:         "Sets up a scheduler to run all Uesio worker jobs as needed, e.g. usage event aggregation every minute, invoicing jobs every day",
		RunE:         runJobs,
		SilenceUsage: true,
	})
}

func runJobs(*cobra.Command, []string) error {
	slog.Info("Running Uesio worker process")
	worker.ScheduleJobs()
	return nil
}
