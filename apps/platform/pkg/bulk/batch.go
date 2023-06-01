package bulk

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type BatchResponse struct {
	ID string `json:"id"`
}

func NewBatch(body io.ReadCloser, jobID string, session *sess.Session) (*meta.BulkBatch, error) {

	var job meta.BulkJob

	// Get the job from the jobID
	err := datasource.PlatformLoadOne(
		&job,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:  adapt.ID_FIELD,
					Value:  jobID,
					Active: true,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}

	if job.Spec.JobType == "IMPORT" {
		return NewImportBatch(body, job, session)
	}

	if job.Spec.JobType == "UPLOADFILES" {
		return NewFileUploadBatch(body, job, session)
	}

	return nil, errors.New("Invalid JobType for creating batches: " + job.Spec.JobType)

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

	err = collections.Load(&metadataResponse, session, nil)
	if err != nil {
		return nil, err
	}
	return &metadataResponse, nil
}
