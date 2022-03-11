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
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio.id",
					Value: jobID,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}

	if job.Spec.JobType == "export" {
		return nil, errors.New("Cannot manually create export batches")
	}

	return NewImportBatch(body, job, session)

}

func getBatchMetadata(collectionName string, session *sess.Session) (*adapt.MetadataCache, error) {

	metadataResponse := adapt.MetadataCache{}
	collections := datasource.MetadataRequest{
		Options: &datasource.MetadataRequestOptions{
			LoadAllFields: true,
		},
	}
	err := collections.AddCollection(collectionName)
	if err != nil {
		return nil, err
	}

	err = collections.Load(&metadataResponse, session)
	if err != nil {
		return nil, err
	}
	return &metadataResponse, nil
}
