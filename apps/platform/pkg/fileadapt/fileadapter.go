package fileadapt

import (
	"errors"
	"io"
	"os"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// FileAdapter interface
type FileAdapter interface {
	Upload(fileData io.Reader, bucket string, path string, creds *adapt.Credentials) error
	Download(bucket, path string, credentials *adapt.Credentials) (io.ReadCloser, error)
	Delete(bucket, path string, credentials *adapt.Credentials) error
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
func GetFileSourceAndCollection(fileCollectionID string, session *sess.Session) (*meta.UserFileCollection, *meta.FileSource, error) {
	ufc, err := meta.NewUserFileCollection(fileCollectionID)
	if err != nil {
		return nil, nil, errors.New("Failed to create file collection: " + err.Error())
	}
	err = bundle.Load(ufc, session)
	if err != nil {
		return nil, nil, errors.New("No file collection found: " + err.Error())
	}
	fs, err := meta.NewFileSource(ufc.FileSource)
	if err != nil {
		return nil, nil, errors.New("Failed to create file source")
	}
	err = bundle.Load(fs, session)
	if err != nil {
		return nil, nil, errors.New("No file source found")
	}
	if fs.Name == "platform" && fs.Namespace == "uesio" {
		value := os.Getenv("UESIO_LOCAL_FILES")
		if value == "true" {
			fs.Type = "uesio.local"
		}
	}
	return ufc, fs, nil
}

func GetFileCollectionID(collectionMetadata *adapt.CollectionMetadata, fieldMetadata *adapt.FieldMetadata) (string, error) {
	if fieldMetadata == nil {
		return "", errors.New("No metadata setup for attachments yet: TODO!")
	}
	if fieldMetadata.FileCollection == "" {
		return "", errors.New("No FileCollection specified for this field: " + collectionMetadata.GetFullName() + " : " + fieldMetadata.GetFullName())
	}
	return fieldMetadata.FileCollection, nil
}

func GetAdapterForUserFile(userFile *meta.UserFileMetadata, session *sess.Session) (FileAdapter, string, *adapt.Credentials, error) {

	ufc, fs, err := GetFileSourceAndCollection(userFile.FileCollectionID, session)
	if err != nil {
		return nil, "", nil, err
	}

	bucket, err := configstore.GetValueFromKey(ufc.Bucket, session)
	if err != nil {
		return nil, "", nil, err
	}

	fileAdapter, err := GetFileAdapter(fs.Type)
	if err != nil {
		return nil, "", nil, err
	}
	credentials, err := adapt.GetCredentials(fs.Credentials, session)
	if err != nil {
		return nil, "", nil, err
	}

	return fileAdapter, bucket, credentials, nil
}
