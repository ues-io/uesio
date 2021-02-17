package bulk

import (
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// NewJob func
func NewJob(spec *meta.JobSpec, session *sess.Session) (string, error) {

	site := session.GetSite()

	job := meta.BulkJob{
		Spec: *spec,
		Site: site.GetFullName(),
	}

	err := datasource.PlatformSaveOne(&job, nil, session)
	if err != nil {
		return "", err
	}

	return job.ID, nil
}
