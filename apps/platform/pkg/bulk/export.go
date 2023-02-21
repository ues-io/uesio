package bulk

import (
	"archive/zip"
	"bytes"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type Exportable interface {
	meta.Group
	GetData() (io.Reader, error)
	GetFileFieldIDs() []string
}

func loadData(op *adapt.LoadOp, session *sess.Session) error {

	_, err := datasource.Load([]*adapt.LoadOp{op}, session, nil)
	if err != nil {
		return err
	}

	if !op.HasMoreBatches {
		return nil
	}

	return loadData(op, session)
}

func NewExportBatch(job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec

	batch := meta.BulkBatch{
		Status:    "started",
		BulkJobID: job.ID,
	}

	err := datasource.PlatformSaveOne(&batch, nil, nil, session)
	if err != nil {
		return nil, err
	}

	tenantID := strings.ReplaceAll(session.GetTenantID(), "/", "_")
	fileName := fmt.Sprintf("uesio_export_%s_%s.zip", tenantID, time.Now().Format(time.RFC3339))

	details := &fileadapt.FileDetails{
		Path:         fileName,
		CollectionID: "uesio/core.bulkbatch",
		RecordID:     batch.ID,
		FieldID:      "uesio/core.result",
	}

	buf := new(bytes.Buffer)

	// Create a new zip archive.
	zipwriter := zip.NewWriter(buf)

	err = exportCollection(retrieve.NewWriterCreator(zipwriter.Create), spec, session)
	if err != nil {
		return nil, err
	}

	zipwriter.Close()

	_, err = filesource.Upload([]filesource.FileUploadOp{
		{
			Data:    buf,
			Details: details,
		},
	}, nil, session)
	if err != nil {
		return nil, err
	}

	// Now update the batch status
	batch.Status = "completed"
	batch.SetItemMeta(&meta.ItemMeta{
		ValidFields: map[string]bool{
			adapt.ID_FIELD:      true,
			"uesio/core.status": true,
		},
	})

	err = datasource.PlatformSaveOne(&batch, nil, nil, session)
	if err != nil {
		return nil, err
	}

	return &batch, nil
}

func exportCollection(create retrieve.WriterCreator, spec *meta.JobSpec, session *sess.Session) error {
	metadataResponse, err := getBatchMetadata(spec.Collection, session)
	if err != nil {
		return err
	}

	//Load operation
	fields := []adapt.LoadRequestField{}
	collectionMetadata, err := metadataResponse.GetCollection(spec.Collection)
	if err != nil {
		return err
	}

	for _, fieldMetadata := range collectionMetadata.Fields {
		// For reference fields, lets just request the id for now
		if adapt.IsReference(fieldMetadata.Type) {
			fields = append(fields, adapt.LoadRequestField{
				ID: fieldMetadata.GetFullName(),
				Fields: []adapt.LoadRequestField{
					{
						ID: adapt.ID_FIELD,
					},
				},
			})
			continue
		}
		fields = append(fields, adapt.LoadRequestField{
			ID: fieldMetadata.GetFullName(),
		})
	}

	var collection Exportable

	if spec.FileType == "CSV" {
		collection = NewCSVExportCollection(collectionMetadata)
	}

	if collection == nil {
		return errors.New("Cannot process that file type: " + spec.FileType)
	}

	op := &adapt.LoadOp{
		WireName:       "uesio_data_export",
		CollectionName: spec.Collection,
		Collection:     collection,
		Fields:         fields,
		Query:          true,
	}

	err = loadData(op, session)
	if err != nil {
		return err
	}

	data, err := collection.GetData()
	if err != nil {
		return err
	}

	file, err := create(fmt.Sprintf("%s.csv", strings.ReplaceAll(spec.Collection, "/", "_")))
	if err != nil {
		return err
	}

	_, err = io.Copy(file, data)
	if err != nil {
		return err
	}

	// Check to see if we found any file fields
	fileIDs := collection.GetFileFieldIDs()

	if len(fileIDs) > 0 {
		for _, fileID := range fileIDs {
			filedata, filemetadata, err := filesource.Download(fileID, session)
			if err != nil {
				return err
			}
			file, err := create(filemetadata.GetRelativePath())
			if err != nil {
				return err
			}
			_, err = io.Copy(file, filedata)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
