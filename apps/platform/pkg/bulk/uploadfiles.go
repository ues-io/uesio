package bulk

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"io/ioutil"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewFileUploadBatch(body io.ReadCloser, job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec

	_, err := getBatchMetadata(spec.Collection, session)
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

	// Read all the files from zip archive
	for _, zipFile := range zipReader.File {
		fmt.Println("Found: " + zipFile.Name)
		// It would be nice to handle an upsert key here.
		/*
			dataStream, err := zipFile.Open()
			if err != nil {
				return nil, err
			}
			_, err = filesource.Upload(dataStream, fileadapt.FileDetails{
				Name:         "doesntmatter",
				CollectionID: spec.Collection,
				RecordID:     zipFile.Name,
				FieldID:      "uesio/crm.image",
			}, nil, session.RemoveWorkspaceContext())
			if err != nil {
				return nil, err
			}
		*/
	}

	batch := meta.BulkBatch{
		Status:    "started",
		BulkJobID: job.ID,
	}

	err = datasource.PlatformSaveOne(&batch, nil, nil, session)
	if err != nil {
		return nil, err
	}

	return &batch, nil
}
