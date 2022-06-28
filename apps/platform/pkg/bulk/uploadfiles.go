package bulk

import (
	"archive/zip"
	"bytes"
	"errors"
	"io"
	"io/ioutil"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
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

	fileStreams := []bundlestore.ReadItemStream{}
	// Read all the files from zip archive
	for _, zipFile := range zipReader.File {
		fileName := zipFile.Name
		f, err := zipFile.Open()
		if err != nil {
			return nil, err
		}
		fileStreams = append(fileStreams, bundlestore.ReadItemStream{
			FileName: fileName,
			Path:     strings.TrimSuffix(fileName, filepath.Ext(fileName)),
			Data:     f,
		})
		defer f.Close()
	}

	uploadOps := []filesource.FileUploadOp{}

	connection, err := datasource.GetPlatformConnection(session)
	if err != nil {
		return nil, err
	}

	connection.SetMetadata(metadata)

	idMap := adapt.LocatorMap{}
	for i := range fileStreams {
		idMap.AddID(fileStreams[i].Path, adapt.ReferenceLocator{
			Item: fileStreams[i],
		})
	}

	err = adapt.LoadLooper(connection, spec.Collection, idMap, []adapt.LoadRequestField{
		{
			ID: adapt.ID_FIELD,
		},
		{
			ID: adapt.UNIQUE_KEY_FIELD,
		},
	}, adapt.UNIQUE_KEY_FIELD, func(item loadable.Item, matchIndexes []adapt.ReferenceLocator) error {
		if len(matchIndexes) != 1 {
			return errors.New("Bad Lookup Here: " + strconv.Itoa(len(matchIndexes)))
		}

		match := matchIndexes[0].Item

		fileStream := match.(bundlestore.ReadItemStream)

		idValue, err := item.GetField(adapt.ID_FIELD)
		if err != nil {
			return err
		}

		uploadOps = append(uploadOps, filesource.FileUploadOp{
			Data: fileStream.Data,
			Details: &fileadapt.FileDetails{
				Name:         fileStream.FileName,
				CollectionID: spec.Collection,
				RecordID:     idValue.(string),
				FieldID:      spec.UploadField,
			},
		})

		// We need to match this to a filestream
		return nil
	})
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
