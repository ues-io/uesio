package fileadapt

import (
	"crypto/md5"
	"errors"
	"io"
	"os"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// FileAdapter interface
type FileAdapter interface {
	Upload(fileData io.Reader, bucket string, path string, creds *Credentials) error
	Download(bucket, path string, credentials *Credentials) (io.ReadCloser, error)
	Delete(bucket, path string, credentials *Credentials) error
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
		return nil, nil, errors.New("Failed to create file collection")
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
			fs.TypeRef = "uesio.local"
		}
	}
	return ufc, fs, nil
}

func GetAdapterForUserFile(userFile *meta.UserFileMetadata, session *sess.Session) (FileAdapter, string, *Credentials, error) {

	ufc, fs, err := GetFileSourceAndCollection(userFile.FileCollectionID, session)
	if err != nil {
		return nil, "", nil, err
	}

	bucket, err := configstore.GetValueFromKey(ufc.Bucket, session)
	if err != nil {
		return nil, "", nil, err
	}

	fileAdapter, err := GetFileAdapter(fs.GetAdapterType())
	if err != nil {
		return nil, "", nil, err
	}
	credentials, err := GetCredentials(fs, session)
	if err != nil {
		return nil, "", nil, err
	}

	return fileAdapter, bucket, credentials, nil
}

// Credentials struct
type Credentials struct {
	Database string
	Username string
	Password string
}

// GetHash function
func (c *Credentials) GetHash() string {
	data := []byte(c.Database + ":" + c.Username + ":" + c.Password)
	sum := md5.Sum(data)
	return string(sum[:])
}

// GetCredentials function
//TODO:: Dig into what this should be
func GetCredentials(fs *meta.FileSource, session *sess.Session) (*Credentials, error) {
	database, err := configstore.Merge(fs.Database, session)
	if err != nil {
		return nil, err
	}
	username, err := secretstore.GetSecretFromKey(fs.Username, session)
	if err != nil {
		return nil, err
	}
	password, err := secretstore.GetSecretFromKey(fs.Password, session)
	if err != nil {
		return nil, err
	}

	return &Credentials{
		Database: database,
		Username: username,
		Password: password,
	}, nil
}
