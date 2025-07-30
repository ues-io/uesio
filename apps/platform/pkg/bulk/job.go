package bulk

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewJob(ctx context.Context, spec *meta.JobSpec, session *sess.Session) (string, error) {

	job := meta.BulkJob{
		Spec:       spec,
		Collection: spec.Collection,
	}

	err := datasource.PlatformSaveOne(ctx, &job, nil, nil, session)
	if err != nil {
		return "", err
	}

	// If we're an export job go ahead and create the batch automatically.
	if job.Spec.JobType == "EXPORT" {
		_, err = NewExportBatch(ctx, job, session)
		if err != nil {
			return "", err
		}
	}

	return job.ID, nil
}
