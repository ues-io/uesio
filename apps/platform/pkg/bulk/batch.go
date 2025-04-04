package bulk

import (
	"fmt"
	"io"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func NewBatch(body io.ReadCloser, jobID string, session *sess.Session) (*meta.BulkBatch, error) {

	var job meta.BulkJob

	// Get the job from the jobID
	err := datasource.PlatformLoadOne(
		&job,
		&datasource.PlatformLoadOptions{
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/core.spec",
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: commonfields.Id,
					Value: jobID,
				},
			},
		},
		session,
	)
	if err != nil {
		return nil, exceptions.NewNotFoundException("bulk job not found: " + jobID)
	}

	if job.Spec.JobType == "IMPORT" {
		return NewImportBatch(body, job, session)
	}

	if job.Spec.JobType == "UPLOADFILES" {
		return NewFileUploadBatch(body, job, session)
	}

	return nil, exceptions.NewBadRequestException(fmt.Sprintf("invalid JobType for creating batches: %s", job.Spec.JobType), nil)

}

func getBatchMetadata(collectionName string, session *sess.Session) (*wire.MetadataCache, error) {

	metadataResponse := wire.MetadataCache{}
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
