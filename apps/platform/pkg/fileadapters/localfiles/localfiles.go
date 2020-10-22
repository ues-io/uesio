package localfiles

import (
	"errors"
	"io"
	"os"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/creds"
)

// FileAdapter struct
type FileAdapter struct {
}

// Delete function
func (a *FileAdapter) Delete(bucket, path string, credentials *creds.FileAdapterCredentials) error {
	fullFilePath := filepath.Join("userfiles", bucket, path)
	err := os.Remove(fullFilePath)
	if err != nil {
		return errors.New("Error Reading File: " + err.Error())
	}
	return nil
}

// Download function
func (a *FileAdapter) Download(bucket, path string, credentials *creds.FileAdapterCredentials) (io.ReadCloser, error) {
	fullFilePath := filepath.Join("userfiles", bucket, path)
	outFile, err := os.Open(fullFilePath)
	if err != nil {
		return nil, errors.New("Error Reading File: " + err.Error())
	}
	return outFile, nil
}

// Upload function
func (a *FileAdapter) Upload(fileData io.Reader, bucket, path string, credentials *creds.FileAdapterCredentials) error {

	fullFilePath := filepath.Join("userfiles", bucket, path)

	directory := filepath.Dir(fullFilePath)

	err := os.MkdirAll(directory, 0744)
	if err != nil {
		return err
	}

	outFile, err := os.Create(fullFilePath)
	if err != nil {
		return errors.New("Error Creating File: " + err.Error())
	}
	defer outFile.Close()
	_, err = io.Copy(outFile, fileData)
	if err != nil {
		return errors.New("Error Writing File: " + err.Error())
	}

	return nil
}
