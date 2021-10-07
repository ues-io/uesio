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
		change[mapping.FieldName] = getValue(data, mapping, index) == "true"
	}
}

func getTextLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) {
		change[mapping.FieldName] = getValue(data, mapping, index)
	}
}

func getReferenceLoader(index int, mapping *meta.FieldMapping, fieldMetadata *adapt.FieldMetadata, getValue valueFunc) loaderFunc {
	return func(change adapt.Item, data interface{}) {
		change[mapping.FieldName] = map[string]interface{}{
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

	spec := job.Spec
	fileFormat := spec.FileType
	var saveRequest []datasource.SaveRequest

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

	if fileFormat == "csv" {
		saveRequest, err = processCSV(body, &spec, &metadataResponse, session)
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
		BulkJobID: jobID,
	}

	err = datasource.PlatformSaveOne(&batch, nil, session)
	if err != nil {
		return nil, err
	}

	return &batch, nil
}
