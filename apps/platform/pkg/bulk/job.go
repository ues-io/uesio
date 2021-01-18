package bulk

import (
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// NewJob func
func NewJob(spec *metadata.JobSpec, session *sess.Session) (string, error) {

	site := session.GetSite()

	job := metadata.BulkJob{
		Spec: *spec,
		Site: site.Name,
	}

	err := datasource.PlatformSaveOne(&job, nil, session)
	if err != nil {
		return "", err
	}

	return job.ID, nil
}
