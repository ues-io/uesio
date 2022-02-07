package bulk

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// NewImportBatch func
func NewImportBatch(body io.ReadCloser, job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec
	fileFormat := spec.FileType
	var saveRequest []datasource.SaveRequest

	metadataResponse, err := getBatchMetadata(spec.Collection, session)
	if err != nil {
		return nil, err
	}

	if fileFormat == "csv" {
		saveRequest, err = processCSV(body, &spec, metadataResponse, session, nil)
		if err != nil {
			return nil, err
		}
	}

	if fileFormat == "tab" {
		saveRequest, err = processCSV(body, &spec, metadataResponse, session, &CSVOptions{
			Comma: '\t',
		})
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
		BulkJobID: job.ID,
	}

	err = datasource.PlatformSaveOne(&batch, nil, session)
	if err != nil {
		return nil, err
	}

	return &batch, nil
}
