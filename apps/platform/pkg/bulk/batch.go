package bulk

import (
	"bytes"
	"encoding/csv"
	"errors"
	"io"
	"mime"
	"path/filepath"
	"strconv"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type valueFunc func(data interface{}, mapping *meta.FieldMapping, index int) string
type loaderFunc func(change adapt.Item, data interface{})

func getBooleanLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) {
		change[fieldMetadata.GetFullName()] = getValue(data, mapping, index) == "true"
	}
}

func getTextLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) {
		change[fieldMetadata.GetFullName()] = getValue(data, mapping, index)
	}
}

func getReferenceLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	if mapping.MatchField == "" {
		return getTextLoader(index, mapping, fieldMetadata, getValue)
	}
	return func(change adapt.Item, data interface{}) {
		change[fieldMetadata.GetFullName()] = map[string]interface{}{
			mapping.MatchField: getValue(data, mapping, index),
		}
	}
}

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

	var batch *meta.BulkBatch

	if job.Spec.JobType == "" {
		return nil, errors.New("Please specify a job type")
	}

	if job.Spec.JobType == "import" {
		batch, err = NewImportBatch(body, job, session)
		if err != nil {
			return nil, err
		}
	}

	if job.Spec.JobType == "export" {
		batch, err = NewExportBatch(body, job, session)
		if err != nil {
			return nil, err
		}
	}

	return batch, nil
}

func loadData(ops []adapt.LoadOp, session *sess.Session) error {

	_, err := datasource.Load(ops, session)
	if err != nil {
		return err
	}

	if !ops[0].HasMoreBatches {
		return nil
	}

	return loadData(ops, session)
}

func getHeaderRow(fields []adapt.LoadRequestField) []string {
	var row []string
	for _, field := range fields {
		row = append(row, field.ID)
	}
	return row
}

func getRow(item loadable.Item, fields []adapt.LoadRequestField) []string {
	var row []string
	for _, field := range fields {
		keyVal, err := item.GetField(field.ID)
		if err == nil {
			keyString, ok := keyVal.(string)
			if ok {
				row = append(row, keyString)
			} else {
				//empty cell
				row = append(row, "")
			}

		}

		if err != nil {
			println("Opps", field.ID, keyVal)
			println(err.Error())
			//empty cell
			row = append(row, "")
		}
	}
	return row
}

func getFileMetadataType(details fileadapt.FileDetails) string {
	if details.FieldID == "" {
		return "attachment"
	}
	return "field"
}

func getFileUniqueName(details fileadapt.FileDetails) string {
	if details.FieldID == "" {
		return details.Name
	}
	return details.FieldID
}

func generateFileName(collectionName string) string {
	y, m, d := time.Now().Date()
	hour, min, sec := time.Now().Clock()
	dateTime := strconv.Itoa(y) + "_" + m.String() + "_" + strconv.Itoa(d) + "_" + strconv.Itoa(hour) + ":" + strconv.Itoa(min) + ":" + strconv.Itoa(sec)

	return collectionName + "_" + dateTime + ".csv"
}

func createBatch(jobID string, status string, session *sess.Session) (meta.BulkBatch, error) {
	batch := meta.BulkBatch{
		Status:    status,
		BulkJobID: jobID,
	}

	err := datasource.PlatformSaveOne(&batch, nil, session)
	if err != nil {
		return batch, err
	}

	return batch, nil
}

func updateBatchStatus(batch meta.BulkBatch, status string, result *meta.UserFileMetadata, session *sess.Session) error {

	batch.Status = status
	if result != nil {
		batch.Result = result
	}

	err := datasource.PlatformSaveOne(&batch, nil, session)
	if err != nil {
		return err
	}

	return nil
}

// NewExportBatch func
func NewExportBatch(body io.ReadCloser, job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec

	batch, err := createBatch(job.ID, "started", session)
	if err != nil {
		return nil, err
	}
	//Metadata
	metadataResponse := adapt.MetadataCache{}
	collections := datasource.MetadataRequest{
		Options: &datasource.MetadataRequestOptions{
			LoadAllFields: true,
		},
	}
	err = collections.AddCollection(spec.Collection)
	if err != nil {
		return nil, err
	}

	err = collections.Load(&metadataResponse, session)
	if err != nil {
		return nil, err
	}

	//Load operation
	ops := make([]adapt.LoadOp, 1)
	fields := []adapt.LoadRequestField{}
	collectionMetadata, err := metadataResponse.GetCollection(spec.Collection)
	if err != nil {
		return nil, err
	}

	for _, fieldKey := range collectionMetadata.Fields {
		fields = append(fields, adapt.LoadRequestField{
			ID: fieldKey.GetFullName(),
		})
	}

	ops[0] = adapt.LoadOp{
		WireName:       "uesio_data_export",
		CollectionName: spec.Collection,
		Collection:     &adapt.Collection{},
		Fields:         fields,
		Query:          true,
	}

	loadData(ops, session)

	//Create CSV
	buffer := new(bytes.Buffer)
	w := csv.NewWriter(buffer)

	headerRow := getHeaderRow(fields)
	if err := w.Write(headerRow); err != nil {
		return nil, err
	}

	err = ops[0].Collection.Loop(func(item loadable.Item, _ interface{}) error {
		row := getRow(item, fields)
		if err := w.Write(row); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	//Store CSV
	fileCollectionID := "uesio.platform"

	details := fileadapt.FileDetails{
		Name:         generateFileName(spec.Collection),
		CollectionID: "uesio.bulkbatches",
		RecordID:     batch.ID,
		FieldID:      "uesio.result",
	}

	ufc, fs, err := fileadapt.GetFileSourceAndCollection(fileCollectionID, session)
	if err != nil {
		return nil, err
	}

	ufm := meta.UserFileMetadata{
		CollectionID:     details.CollectionID,
		MimeType:         mime.TypeByExtension(filepath.Ext(details.Name)),
		FieldID:          details.FieldID,
		Type:             getFileMetadataType(details),
		FileCollectionID: fileCollectionID,
		FileName:         details.Name,
		Name:             getFileUniqueName(details),
		RecordID:         details.RecordID,
	}

	path, err := ufc.GetFilePath(&ufm)
	if err != nil {
		return nil, errors.New("error generating path for userfile: " + err.Error())
	}

	ufm.Path = path

	err = datasource.PlatformSaveOne(&ufm, &adapt.SaveOptions{
		Upsert: &adapt.UpsertOptions{},
	}, session)
	if err != nil {
		return nil, err
	}

	fileAdapter, err := fileadapt.GetFileAdapter(fs.Type, session)
	if err != nil {
		return nil, err
	}
	credentials, err := adapt.GetCredentials(fs.Credentials, session)
	if err != nil {
		return nil, err
	}
	bucket, err := configstore.GetValueFromKey(ufc.Bucket, session)
	if err != nil {
		return nil, err
	}

	w.Flush()

	if err := w.Error(); err != nil {
		return nil, err
	}

	err = fileAdapter.Upload(buffer, bucket, path, credentials)
	if err != nil {
		return nil, err
	}

	//completed
	err = updateBatchStatus(batch, "completed", &ufm, session)
	if err != nil {
		return nil, err
	}

	return &batch, nil
}

// NewImportBatch func
func NewImportBatch(body io.ReadCloser, job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec
	fileFormat := spec.FileType
	var saveRequest []datasource.SaveRequest

	metadataResponse := adapt.MetadataCache{}
	collections := datasource.MetadataRequest{
		Options: &datasource.MetadataRequestOptions{
			LoadAllFields: true,
		},
	}
	err := collections.AddCollection(spec.Collection)
	if err != nil {
		return nil, err
	}

	err = collections.Load(&metadataResponse, session)
	if err != nil {
		return nil, err
	}

	if fileFormat == "csv" {
		saveRequest, err = processCSV(body, &spec, &metadataResponse, session, nil)
		if err != nil {
			return nil, err
		}
	}

	if fileFormat == "tab" {
		saveRequest, err = processCSV(body, &spec, &metadataResponse, session, &CSVOptions{
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
