package bulk

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// NewBatch func
func NewBatch(body io.ReadCloser, jobID string, session *sess.Session) (string, error) {

	var job metadata.BulkJob

	// Get the job from the jobID
	err := datasource.PlatformLoadOne(
		&job,
		[]adapters.LoadRequestCondition{
			{
				Field: "uesio.id",
				Value: jobID,
			},
		},
		session,
	)
	if err != nil {
		return "", err
	}

	spec := job.Spec
	fileFormat := spec.FileType
	var saveRequestBatch *datasource.SaveRequestBatch

	if fileFormat == "csv" {
		saveRequestBatch, err = processCSV(body, &spec, session)
		if err != nil {
			return "", err
		}
	}

	if saveRequestBatch == nil {
		return "", errors.New("Cannot process that file type: " + fileFormat)
	}

	_, err = datasource.Save(*saveRequestBatch, session)
	if err != nil {
		return "", err
	}

	batch := metadata.BulkBatch{
		Status:    "started",
		BulkJobID: jobID,
	}

	err = datasource.PlatformSaveOne(&batch, nil, session)
	if err != nil {
		return "", err
	}

	return batch.ID, nil
}
