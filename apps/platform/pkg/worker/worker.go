package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"syscall"
	"time"

	"github.com/robfig/cron/v3"

	"github.com/thecloudmasters/uesio/pkg/controller"
	"github.com/thecloudmasters/uesio/pkg/invoices"
	"github.com/thecloudmasters/uesio/pkg/usage/usage_worker"
)

var jobs []Job

// Register all jobs that should be performed
func init() {
	jobs = append(jobs, NewJob("Invoices", "@daily", invoices.InvoicingJobNoContext))
	jobs = append(jobs, NewJob("Usage", getUsageCronSchedule(), usage_worker.UsageWorkerNoContext))
	jobs = append(jobs, NewJob("HealthCheck", "@every 30s", healthcheckNoContext))
}

// Allows for usage job frequency to be overridden by environment variables. defaults to every 10 minutes,
// but can be as frequent as every 1 minute
func getUsageCronSchedule() string {
	usageJobRecurrenceMinutes := os.Getenv("UESIO_USAGE_JOB_RECURRENCE_MINUTES")
	if usageJobRecurrenceMinutes == "" {
		usageJobRecurrenceMinutes = "10"
	}
	intVal, err := strconv.Atoi(usageJobRecurrenceMinutes)
	if err != nil || intVal < 1 || intVal > 30 {
		// Intentionally not calling ErrorContext here because we can't obtain anything other than a background context
		// TODO: Refactor worker init & job scheduling
		slog.Error("UESIO_USAGE_JOB_RECURRENCE_MINUTES must be an integer in the range [1, 30]")
		os.Exit(1)
	}
	return fmt.Sprintf("*/%d * * * *", intVal)
}

// ScheduleJobs schedules all configured Uesio worker jobs, such as usage event aggregation, to be run on a schedule
func ScheduleJobs(ctx context.Context) {

	// write file as soon as we can to help docker, ecs, etc. detect initial health. The healthcheck job won't run
	// for the first time until 30 seconds after the worker starts which delays initial health detection.
	slog.InfoContext(ctx, "Writing initial health check file...")
	if err := writeHealthCheckFile(); err != nil {
		slog.ErrorContext(ctx, fmt.Sprintf("Failed to write health check file, reason: %s", err.Error()))
	}

	slog.InfoContext(ctx, "Configuring scheduler...")
	s := cron.New(cron.WithLocation(time.UTC))

	var jobEntries = make([]cron.EntryID, len(jobs))

	// Load all jobs
	for i, job := range jobs {
		schedule := job.Schedule()
		slog.InfoContext(ctx, fmt.Sprintf("Scheduling job %s with schedule: %s", job.Name(), schedule))
		entryId, err := s.AddFunc(job.Schedule(), wrapJob(ctx, job))
		if err != nil {
			slog.ErrorContext(ctx, fmt.Sprintf("Failed to schedule job %s, reason: %s", job.Name(), err.Error()))
		} else {
			jobEntries[i] = entryId
		}

	}
	slog.InfoContext(ctx, "Finished loading all jobs, starting scheduler now...")

	// (Helpful for local development to see when jobs will next be run...)
	//go func() {
	//	time.Sleep(time.Second * 2)
	//	for {
	//		for i, entryID := range jobEntries {
	//			slog.InfoContext(ctx, fmt.Sprintf("Cron job %s (%d) next run will be at: %s", jobs[i].Name(), entryID, s.Entry(entryID).Next.Format(time.Stamp)))
	//		}
	//		time.Sleep(time.Minute)
	//	}
	//}()

	s.Start()

	// Block until process is terminated
	done := make(chan os.Signal, 1)
	signal.Notify(done, syscall.SIGINT, syscall.SIGTERM)
	<-done // Will block here until process is terminated
	gracePeriod := controller.GetGracefulShutdownSeconds()
	slog.InfoContext(ctx, fmt.Sprintf("Received SIGTERM, stopping job scheduler with %d second grace period...", gracePeriod))
	s.Stop()
	time.Sleep(time.Duration(gracePeriod) * time.Second)
	slog.InfoContext(ctx, "Worker process completed.")
}

// wraps a Job so that we can perform logging and other utility work,
// and so that the loop properly captures the closure scope
func wrapJob(ctx context.Context, job Job) func() {
	return func() {
		jobErr := job.Run()
		if jobErr != nil {
			slog.ErrorContext(ctx, fmt.Sprintf("%s job failed reason: %s", job.Name(), jobErr.Error()))
		}
	}
}

// Very basic healthcheck that can be used by docker, ecs, etc. to monitor "relative" health of worker.
// TODO: This can be expanded to maintain metrics of other jobs, check db connections, etc. and possibly
// be turned in to http server for metrics/status checks/etc.
func healthcheckNoContext() error {
	return healthcheck(context.Background())
}

func healthcheck(ctx context.Context) error {
	slog.InfoContext(ctx, "Running healthcheck job")

	return writeHealthCheckFile()
}

func writeHealthCheckFile() error {
	healthData := map[string]any{
		"timestamp":  time.Now().UTC(),
		"status":     "healthy",
		"jobs_count": len(jobs),
	}

	data, err := json.Marshal(healthData)
	if err != nil {
		return err
	}

	filepath := filepath.Join(getHealthDir(), "worker-healthcheck.json")
	return os.WriteFile(filepath, data, 0644)
}

func getHealthDir() string {
	if healthDir := os.Getenv("UESIO_WORKER_HEALTH_DIR"); healthDir != "" {
		return healthDir
	}

	// Default to system temp directory
	return os.TempDir()
}
