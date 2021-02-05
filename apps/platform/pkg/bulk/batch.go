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
func NewBatch(body io.ReadCloser, jobID string, session *sess.Session) (*meta.BulkBatch, error) {

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
		return nil, err
	}

	spec := job.Spec
	fileFormat := spec.FileType
	var saveRequest []datasource.SaveRequest

	if fileFormat == "csv" {
		saveRequest, err = processCSV(body, &spec, session)
		if err != nil {
			return nil, err
		}
	}

	if saveRequest == nil {
		return nil, errors.New("Cannot process that file type: " + fileFormat)
	}

	err = datasource.Save(saveRequest, session)
	if err != nil {
		return nil, err
	}

	batch := meta.BulkBatch{
		Status:    "started",
		BulkJobID: jobID,
	}

	err = datasource.PlatformSaveOne(&batch, nil, session)
	if err != nil {
		return nil, err
	}

	return &batch, nil
}
