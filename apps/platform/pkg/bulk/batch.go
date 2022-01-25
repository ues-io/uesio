package bulk

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
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

	println(ops[0].BatchNumber)
	println(ops[0].HasMoreBatches)

	if !ops[0].HasMoreBatches {
		return nil
	}

	return loadData(ops, session)
}

// NewExportBatch func
func NewExportBatch(body io.ReadCloser, job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec
	//fileFormat := spec.FileType
	//var saveRequest []datasource.SaveRequest

	//MEta
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

	//MEta

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
		//Conditions:     loadConditions,
		Fields:    fields,
		Order:     []adapt.LoadRequestOrder{{Field: "uesio.id", Desc: true}},
		Query:     true,
		BatchSize: 2,
		//BatchNumber: batchNumber,
	}

	loadData(ops, session)

	//Create CSV

	//ops[0].Collection.Loop()

	// lookupResult := map[string]loadable.Item{}
	// err := op.Collection.Loop(func(item loadable.Item, _ interface{}) error {
	// 	keyVal, err := item.GetField(keyField)
	// 	if err == nil {
	// 		keyString, ok := keyVal.(string)
	// 		if ok {
	// 			lookupResult[keyString] = item
	// 		}
	// 	}
	// 	return nil
	// })
	// if err != nil {
	// 	return nil, err
	// }
	// return lookupResult, nil

	//Store CSV using the file API

	//Change the batch status

	batch := meta.BulkBatch{
		Status:    "started",
		BulkJobID: job.ID,
	}

	// err = datasource.PlatformSaveOne(&batch, nil, session)
	// if err != nil {
	// 	return nil, err
	// }

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
