package fileadapters

import (
	"errors"
	"io"
	"os"

	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// FileAdapter interface
type FileAdapter interface {
	Upload(fileData io.Reader, bucket string, path string, creds *creds.FileAdapterCredentials) error
	Download(bucket, path string, credentials *creds.FileAdapterCredentials) (io.ReadCloser, error)
	Delete(bucket, path string, credentials *creds.FileAdapterCredentials) error
}

var adapterMap = map[string]FileAdapter{}

// GetFileAdapter gets an adapter of a certain type
func GetFileAdapter(adapterType string) (FileAdapter, error) {
	adapter, ok := adapterMap[adapterType]
	if !ok {
		return nil, errors.New("No adapter found of this type: " + adapterType)
	}
	return adapter, nil
}

// RegisterFileAdapter function
func RegisterFileAdapter(name string, adapter FileAdapter) {
	adapterMap[name] = adapter
}

// GetFileSourceAndCollection function
func GetFileSourceAndCollection(fileCollectionID string, session *sess.Session) (*metadata.UserFileCollection, *metadata.FileSource, error) {
	ufc, err := metadata.NewUserFileCollection(fileCollectionID)
	if err != nil {
		return nil, nil, errors.New("Failed to create file collection")
	}
	err = bundles.Load(ufc, session)
	if err != nil {
		return nil, nil, errors.New("No file collection found: " + err.Error())
	}
	fs, err := metadata.NewFileSource(ufc.FileSource)
	if err != nil {
		return nil, nil, errors.New("Failed to create file source")
	}
	err = bundles.Load(fs, session)
	if err != nil {
		return nil, nil, errors.New("No file source found")
	}
	if fs.Name == "platform" && fs.Namespace == "uesio" {
		value := os.Getenv("UESIO_LOCAL_FILES")
		if value == "true" {
			fs.TypeRef = "uesio.local"
		}
	}
	return ufc, fs, nil
}

func GetAdapterForUserFile(userFile *metadata.UserFileMetadata, session *sess.Session) (FileAdapter, string, *creds.FileAdapterCredentials, error) {
	site := session.GetSite()

	ufc, fs, err := GetFileSourceAndCollection(userFile.FileCollectionID, session)
	if err != nil {
		return nil, "", nil, err
	}
	bucket, err := ufc.GetBucket(site)
	if err != nil {
		return nil, "", nil, err
	}

	fileAdapter, err := GetFileAdapter(fs.GetAdapterType())
	if err != nil {
		return nil, "", nil, err
	}
	credentials, err := fs.GetCredentials(site)
	if err != nil {
		return nil, "", nil, err
	}

	return fileAdapter, bucket, credentials, nil
}
