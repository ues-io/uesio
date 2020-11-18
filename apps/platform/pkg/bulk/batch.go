package bulk

import (
	"encoding/json"
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// NewBatch func
func NewBatch(body io.ReadCloser, jobID string, session *sess.Session) (string, error) {

	var jobs metadata.BulkJobCollection
	var jobSpec metadata.JobSpec

	// Get the job from the jobID
	err := datasource.PlatformLoadOne(
		&job,
		[]reqs.LoadRequestCondition{
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

	job := jobs[0]
	err = json.Unmarshal([]byte(job.Spec), &jobSpec)

	if err != nil {
		return "", err
	}

	fileFormat := jobSpec.FileType
	var saveRequestBatch *datasource.SaveRequestBatch

	if fileFormat == "csv" {
		saveRequestBatch, err = processCSV(body, &jobSpec, session)
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

	batches := metadata.BulkBatchCollection{
		metadata.BulkBatch{
			Status:    "started",
			BulkJobID: jobID,
		},
	}

	responses, err := datasource.PlatformSave([]datasource.PlatformSaveRequest{
		{
			Collection: &batches,
		},
	}, session)
	if err != nil {
		return "", err
	}

	response := responses[0]
	result := response.ChangeResults["0"]
	newID := result.Data["uesio.id"].(string)

	return newID, nil
}
