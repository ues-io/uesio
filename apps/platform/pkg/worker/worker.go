package worker

import (
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/robfig/cron/v3"

	"github.com/thecloudmasters/uesio/pkg/invoices"
	"github.com/thecloudmasters/uesio/pkg/usage/usage_worker"
)

var jobs []Job

// Register all jobs that should be performed
func init() {
	jobs = append(jobs, NewJob("Invoices", "@daily", invoices.InvoicingJob))
	jobs = append(jobs, NewJob("Usage", getUsageCronSchedule(), usage_worker.UsageWorker))
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
		slog.Error("UESIO_USAGE_JOB_RECURRENCE_MINUTES must be an integer in the range [1, 30]")
		os.Exit(1)
	}
	return fmt.Sprintf("*/%d * * * *", intVal)
}

// ScheduleJobs schedules all configured Uesio worker jobs, such as usage event aggregation, to be run on a schedule
func ScheduleJobs() {

	s := cron.New(cron.WithLocation(time.UTC))

	var jobEntries = make([]cron.EntryID, len(jobs))

	// Load all jobs
	for i, job := range jobs {
		schedule := job.Schedule()
		slog.Info("Scheduling job " + job.Name() + " with schedule: " + schedule)
		entryId, err := s.AddFunc(job.Schedule(), wrapJob(job))
		if err != nil {
			slog.Error("Failed to schedule job %s, reason: %s", job.Name(), err.Error())
		} else {
			jobEntries[i] = entryId
		}

	}
	slog.Info("Finished loading all jobs, starting scheduler now...")

	// (Helpful for local development to see when jobs will next be run...)
	//go func() {
	//	time.Sleep(time.Second * 2)
	//	for {
	//		for i, entryID := range jobEntries {
	//			slog.Info(fmt.Sprintf("Cron job %s (%d) next run will be at: %s", jobs[i].Name(), entryID, s.Entry(entryID).Next.Format(time.Stamp)))
	//		}
	//		time.Sleep(time.Minute)
	//	}
	//}()

	s.Start()

	// Block until process is terminated
	done := make(chan os.Signal, 1)
	signal.Notify(done, syscall.SIGINT, syscall.SIGTERM)
	<-done // Will block here until process is terminated
	slog.Info("Received SIGTERM, stopping job scheduler with 5 second grace period...")
	s.Stop()
	time.Sleep(5 * time.Second)
	slog.Info("Process completed")
}

// wraps a Job so that we can perform logging and other utility work,
// and so that the loop properly captures the closure scope
func wrapJob(job Job) func() {
	return func() {
		jobErr := job.Run()
		if jobErr != nil {
			slog.Error("%s job failed reason: %s", job.Name(), jobErr.Error())
		}
	}
}
