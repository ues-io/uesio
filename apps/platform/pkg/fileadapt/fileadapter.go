package fileadapt

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// FileAdapter interface
type FileAdapter interface {
	//Upload(fileData io.Reader, bucket string, path string, creds *adapt.Credentials) error
	//Download(bucket, path string, credentials *adapt.Credentials) (io.ReadCloser, error)
	//Delete(bucket, path string, credentials *adapt.Credentials) error
	GetFileConnection(*adapt.Credentials) (FileConnection, error)
}

type FileConnection interface {
	Upload(fileData io.Reader, path string) error
	Download(path string) (io.ReadCloser, error)
	Delete(path string) error
	List(path string) ([]string, error)
}

var adapterMap = map[string]FileAdapter{}

// GetFileAdapter gets an adapter of a certain type
func GetFileAdapter(adapterType string, session *sess.Session) (FileAdapter, error) {
	mergedType, err := configstore.Merge(adapterType, session)
	if err != nil {
		return nil, err
	}
	adapter, ok := adapterMap[mergedType]
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
	return ufc, fs, nil
}

func GetFileCollectionID(collectionMetadata *adapt.CollectionMetadata, fieldMetadata *adapt.FieldMetadata) (string, error) {
	if fieldMetadata == nil {
		return "", errors.New("No metadata setup for attachments yet: TODO!")
	}
	if fieldMetadata.FileMetadata.FileCollection == "" {
		return "", errors.New("No FileCollection specified for this field: " + collectionMetadata.GetFullName() + " : " + fieldMetadata.GetFullName())
	}
	return fieldMetadata.FileMetadata.FileCollection, nil
}

func GetFileConnection(fileSourceID string, session *sess.Session) (FileConnection, error) {
	fs, err := meta.NewFileSource(fileSourceID)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(fs, session)
	if err != nil {
		return nil, err
	}

	fileAdapter, err := GetFileAdapter(fs.Type, session)
	if err != nil {
		return nil, err
	}
	credentials, err := adapt.GetCredentials(fs.Credentials, session)
	if err != nil {
		return nil, err
	}

	return fileAdapter.GetFileConnection(credentials)

}
