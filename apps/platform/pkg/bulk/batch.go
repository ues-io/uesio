package bulk

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// NewBatch func
func NewBatch(body io.ReadCloser, jobID string, session *sess.Session) (string, error) {

	var job meta.BulkJob

	// Get the job from the jobID
	err := datasource.PlatformLoadOne(
		&job,
		[]adapt.LoadRequestCondition{
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

	batch := meta.BulkBatch{
		Status:    "started",
		BulkJobID: jobID,
	}

	err = datasource.PlatformSaveOne(&batch, nil, session)
	if err != nil {
		return "", err
	}

	return batch.ID, nil
}
