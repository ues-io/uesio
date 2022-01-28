package bulk

import (
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// NewJob func
func NewJob(spec *meta.JobSpec, session *sess.Session) (string, error) {

	job := meta.BulkJob{
		Spec:       *spec,
		Collection: *&spec.Collection,
	}

	err := datasource.PlatformSaveOne(&job, nil, session)
	if err != nil {
		return "", err
	}

	return job.ID, nil
}
