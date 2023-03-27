package worker

type Job interface {
	Name() string
	Schedule() string
	Run() error
}

type JobImpl struct {
	name     string
	schedule string
	runnable func() error
}

func (j *JobImpl) Name() string {
	return j.name
}
func (j *JobImpl) Run() error {
	return j.runnable()
}
func (j *JobImpl) Schedule() string {
	return j.schedule
}

func NewJob(name, schedule string, runnable func() error) Job {
	return &JobImpl{
		name:     name,
		schedule: schedule,
		runnable: runnable,
	}
}
