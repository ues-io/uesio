package bulk

import (
	"archive/zip"
	"bytes"
	"encoding/csv"
	"errors"
	"io"

	"github.com/dimchansky/utfbom"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewFileUploadBatch(body io.ReadCloser, job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec

	if spec.Collection == "" {
		return nil, errors.New("Collection is required for an upload job")
	}

	// Unfortunately, we have to read the whole thing into memory
	bodybytes, err := io.ReadAll(body)
	if err != nil {
		return nil, err
	}

	zipReader, err := zip.NewReader(bytes.NewReader(bodybytes), int64(len(bodybytes)))
	if err != nil {
		return nil, err
	}

	uploadOps := []*filesource.FileUploadOp{}
	// Read all the files from zip archive

	// First open upload.csv
	manifest, err := zipReader.Open("upload.csv")
	if err != nil {
		return nil, errors.New("No upload upload.csv manifiest file provided")
	}

	defer manifest.Close()

	r := csv.NewReader(utfbom.SkipOnly(manifest))
	r.LazyQuotes = true

	// Handle the header row
	headerRow, err := r.Read()
	if err != nil {
		return nil, err
	}

	columnIndexes := map[string]int{}
	for index, columnName := range headerRow {
		columnIndexes[columnName] = index
	}

	recordIDIndex, ok := columnIndexes["uesio/core.recordid"]
	if !ok {
		return nil, errors.New("No record id column provided in upload.csv")
	}

	fieldIDIndex, ok := columnIndexes["uesio/core.fieldid"]
	if !ok {
		return nil, errors.New("No field id column provided in upload.csv")
	}

	pathIndex, ok := columnIndexes["uesio/core.path"]
	if !ok {
		return nil, errors.New("No path column provided in upload.csv")
	}

	sourcePathIndex, ok := columnIndexes["uesio/core.sourcepath"]
	if !ok {
		// If we didn't get a source path, just use the path as the source path
		sourcePathIndex = pathIndex
	}

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		recordid := record[recordIDIndex]
		if recordid == "" {
			return nil, errors.New("No record id provided for upload")
		}

		path := record[pathIndex]
		if path == "" {
			return nil, errors.New("No path provided for upload")
		}

		sourcePath := record[sourcePathIndex]
		if sourcePath == "" {
			return nil, errors.New("No source path provided for upload")
		}

		// It's ok for fieldid to be an empty string.
		// That means it's an attachment
		fieldid := record[fieldIDIndex]

		f, err := zipReader.Open("files/" + sourcePath)
		if err != nil {
			return nil, errors.New("No file found at path: " + path)
		}
		uploadOps = append(uploadOps, &filesource.FileUploadOp{
			Data:            f,
			Path:            path,
			CollectionID:    spec.Collection,
			RecordUniqueKey: recordid,
			FieldID:         fieldid,
		})
		defer f.Close()

	}

	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		return nil, err
	}

	_, err = filesource.Upload(uploadOps, connection, session, nil)
	if err != nil {
		return nil, err
	}

	batch := meta.BulkBatch{
		Status:    "started",
		BulkJobID: job.ID,
	}

	err = datasource.PlatformSaveOne(&batch, nil, connection, session)
	if err != nil {
		return nil, err
	}

	return &batch, nil
}
