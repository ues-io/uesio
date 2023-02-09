package cmd

import (
	"time"

	"github.com/go-co-op/gocron"
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func init() {
	rootCmd.AddCommand(&cobra.Command{
		Use:   "work",
		Short: "uesio work",
		Run:   work,
	})
}

func work(cmd *cobra.Command, args []string) {

	logger.Log("Running uesio worker", logger.INFO)
	s := gocron.NewScheduler(time.UTC)
	//enforcing tags to be unique
	s.TagsUnique()
	//SingletonModeAll prevents new jobs from starting if the prior instance of the particular job has not yet completed its run
	s.SingletonModeAll()

	for {
		err := getAllScheduledJobs(s)
		if err != nil {
			logger.Log("Get all scheduled jobs failed reason: "+err.Error(), logger.ERROR)
		}

		// starts the scheduler and blocks current execution path
		s.StartBlocking()

		//Clear all schduled jobs
		s.Clear()
	}

}

func getAllScheduledJobs(scheduler *gocron.Scheduler) error {
	logger.Log("Get all scheduled jobs Job Running", logger.INFO)

	session, err := auth.GetStudioSystemSession(nil)
	if err != nil {
		return err
	}

	var jobs meta.ScheduledJobCollection
	err = datasource.PlatformLoad(&jobs, nil, session)
	if err != nil {
		return err
	}

	//schdule all jobs
	for _, job := range jobs {

		namespace, name, err := meta.ParseKey(job.BotRef)
		if err != nil {
			return err
		}

		robot := meta.NewScheduledBot(namespace, name)
		err = bundle.Load(robot, session, nil) //TO-DO check connection
		if err != nil {
			return err
		}

		botAPI := &datasource.CallBotAPI{} //TO-DO export session?

		err = datasource.HydrateBot(robot, session)
		if err != nil {
			return err
		}

		dialect, err := datasource.GetBotDialect(robot.Dialect)
		if err != nil {
			return err
		}

		cronJob, err := scheduler.Cron(job.Schedule).Do(dialect.CallBot(robot, botAPI))

		println(cronJob)

		//add cronJob reference to SCHEDULED_JOB_EXECUTION

	}

	logger.Log("Job completed, no issues found", logger.INFO)
	return nil
}
