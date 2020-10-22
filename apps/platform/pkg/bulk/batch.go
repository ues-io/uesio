package bulk

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// NewBatch func
func NewBatch(body io.ReadCloser, jobID string, site *metadata.Site, sess *session.Session) (string, error) {

	var jobs metadata.BulkJobCollection

	// Get the job from the jobID
	err := datasource.PlatformLoad(
		[]metadata.CollectionableGroup{
			&jobs,
		},
		[]reqs.LoadRequest{
			reqs.NewPlatformLoadRequest(
				"jobWire",
				jobs.GetName(),
				jobs.GetFields(),
				[]reqs.LoadRequestCondition{
					{
						Field: "uesio.id",
						Value: jobID,
					},
				},
			),
		},
		site,
		sess,
	)
	if err != nil {
		return "", err
	}

	job := jobs[0]
	spec := job.Spec
	fileFormat := spec.FileType
	var saveRequestBatch *datasource.SaveRequestBatch

	if fileFormat == "csv" {
		saveRequestBatch, err = processCSV(body, &spec, site, sess)
		if err != nil {
			return "", err
		}
	}

	if saveRequestBatch == nil {
		return "", errors.New("Cannot process that file type: " + fileFormat)
	}

	_, err = datasource.Save(*saveRequestBatch, site, sess)
	if err != nil {
		return "", err
	}

	batches := metadata.BulkBatchCollection{
		metadata.BulkBatch{
			Status: "started",
		},
	}

	responses, err := datasource.PlatformSave([]datasource.PlatformSaveRequest{
		{
			Collection: &batches,
		},
	}, site, sess)
	if err != nil {
		return "", err
	}

	response := responses[0]
	result := response.ChangeResults["0"]
	newID := result.Data["uesio.id"].(string)

	return newID, nil
}
