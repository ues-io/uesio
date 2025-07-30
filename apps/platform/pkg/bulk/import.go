package bulk

import (
	"context"
	"fmt"
	"io"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewImportBatch(ctx context.Context, body io.ReadCloser, job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec
	fileFormat := spec.FileType
	var saveRequest []datasource.SaveRequest

	metadataResponse, err := getBatchMetadata(ctx, spec.Collection, session)
	if err != nil {
		return nil, err
	}

	if fileFormat == "CSV" {
		saveRequest, err = processCSV(body, spec, metadataResponse, session, nil)
		if err != nil {
			return nil, err
		}
	}

	if fileFormat == "TAB" {
		saveRequest, err = processCSV(body, spec, metadataResponse, session, &CSVOptions{
			Comma: '\t',
		})
		if err != nil {
			return nil, err
		}
	}

	if saveRequest == nil {
		return nil, fmt.Errorf("cannot process that file type: %s", fileFormat)
	}

	err = datasource.Save(ctx, saveRequest, session)
	err = datasource.HandleSaveRequestErrors(saveRequest, err)
	if err != nil {
		return nil, err
	}

	batch := meta.BulkBatch{
		Status:    "started",
		BulkJobID: job.ID,
	}

	err = datasource.PlatformSaveOne(ctx, &batch, nil, nil, session)
	if err != nil {
		return nil, err
	}

	return &batch, nil
}
