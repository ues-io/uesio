package fileadapt

import (
	"errors"
	"io"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type FileAdapter interface {
	GetFileConnection(*adapt.Credentials, string) (FileConnection, error)
}

type FileConnection interface {
	Upload(fileData io.Reader, path string) error
	Download(path string) (time.Time, io.ReadCloser, error)
	Delete(path string) error
	List(path string) ([]string, error)
	EmptyDir(path string) error
}

var adapterMap = map[string]FileAdapter{}

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

func RegisterFileAdapter(name string, adapter FileAdapter) {
	adapterMap[name] = adapter
}

func GetFileConnection(fileSourceID string, session *sess.Session) (FileConnection, error) {
	fs, err := meta.NewFileSource(fileSourceID)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(fs, session, nil)
	if err != nil {
		return nil, err
	}

	fileAdapter, err := GetFileAdapter(fs.Type, session)
	if err != nil {
		return nil, err
	}
	credentials, err := creds.GetCredentials(fs.Credentials, session)
	if err != nil {
		return nil, err
	}

	mergedBucket, err := configstore.Merge(fs.Bucket, session)
	if err != nil {
		return nil, err
	}

	return fileAdapter.GetFileConnection(credentials, mergedBucket)
}
