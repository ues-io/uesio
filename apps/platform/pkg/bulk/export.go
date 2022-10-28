package bulk

import (
	"errors"
	"io"
	"strconv"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type Exportable interface {
	meta.Group
	GetData() (io.Reader, error)
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

func generateFileName(collectionName string) string {
	y, m, d := time.Now().Date()
	hour, min, sec := time.Now().Clock()
	dateTime := strconv.Itoa(y) + "_" + m.String() + "_" + strconv.Itoa(d) + "_" + strconv.Itoa(hour) + ":" + strconv.Itoa(min) + ":" + strconv.Itoa(sec)

	return collectionName + "_" + dateTime + ".csv"
}

func NewExportBatch(job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec
	fileFormat := spec.FileType

	metadataResponse, err := getBatchMetadata(spec.Collection, session)
	if err != nil {
		return nil, err
	}

	//Load operation
	fields := []adapt.LoadRequestField{}
	collectionMetadata, err := metadataResponse.GetCollection(spec.Collection)
	if err != nil {
		return nil, err
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

	if fileFormat == "CSV" {
		collection = NewCSVExportCollection(collectionMetadata)
	}

	if collection == nil {
		return nil, errors.New("Cannot process that file type: " + fileFormat)
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
		return nil, err
	}

	batch := meta.BulkBatch{
		Status:    "started",
		BulkJobID: job.ID,
	}

	err = datasource.PlatformSaveOne(&batch, nil, nil, session)
	if err != nil {
		return nil, err
	}

	details := &fileadapt.FileDetails{
		Name:         generateFileName(spec.Collection),
		CollectionID: "uesio/core.bulkbatch",
		RecordID:     batch.ID,
		FieldID:      "uesio/core.result",
	}

	data, err := collection.GetData()
	if err != nil {
		return nil, err
	}

	_, err = filesource.Upload([]filesource.FileUploadOp{
		{
			Data:    data,
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
