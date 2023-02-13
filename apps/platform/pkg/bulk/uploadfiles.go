package bulk

import (
	"archive/zip"
	"bytes"
	"errors"
	"io"
	"io/ioutil"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewFileUploadBatch(body io.ReadCloser, job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec

	if spec.Collection == "" {
		return nil, errors.New("Collection is required for an upload job")
	}

	metadata, err := getBatchMetadata(spec.Collection, session)
	if err != nil {
		return nil, err
	}

	// Unfortunately, we have to read the whole thing into memory
	bodybytes, err := ioutil.ReadAll(body)
	if err != nil {
		return nil, err
	}

	zipReader, err := zip.NewReader(bytes.NewReader(bodybytes), int64(len(bodybytes)))
	if err != nil {
		return nil, err
	}

	uploadOps := []filesource.FileUploadOp{}
	// Read all the files from zip archive
	for _, zipFile := range zipReader.File {
		fileName := zipFile.Name
		f, err := zipFile.Open()
		if err != nil {
			return nil, err
		}

		// For this to work, the filename (without the extension) must
		// be the uniquekey of the record to attach to
		path := fileName
		uniqueRecordKey := strings.TrimSuffix(path, filepath.Ext(path))
		uploadOps = append(uploadOps, filesource.FileUploadOp{
			Data: f,
			Details: &fileadapt.FileDetails{
				Path:            path,
				CollectionID:    spec.Collection,
				RecordUniqueKey: uniqueRecordKey,
				FieldID:         spec.UploadField,
			},
		})
		defer f.Close()
	}

	connection, err := datasource.GetPlatformConnection(metadata, session, nil)
	if err != nil {
		return nil, err
	}

	_, err = filesource.Upload(uploadOps, connection, session)
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
