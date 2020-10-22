package fileadapters

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/creds"
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
