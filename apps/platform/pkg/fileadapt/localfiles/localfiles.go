package localfiles

import (
	"errors"
	"io"
	"os"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
)

// FileAdapter struct
type FileAdapter struct {
}

func removeEmptyDir(path string) {
	if path == "" {
		return
	}
	err := os.Remove(path)
	if err != nil {
		// The dir had contents, so fail
		return
	}
	removeEmptyDir(filepath.Dir(path))
}

func (a *FileAdapter) GetFileConnection(credentials *adapt.Credentials) (fileadapt.FileConnection, error) {
	return &Connection{}, nil
}

type Connection struct {
	credentials *adapt.Credentials
}

func (c *Connection) List(path string) ([]string, error) {
	return nil, nil
}

func (c *Connection) Upload(fileData io.Reader, path string) error {

	directory := filepath.Dir(path)

	err := os.MkdirAll(directory, 0744)
	if err != nil {
		return err
	}

	outFile, err := os.Create(path)
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

func (c *Connection) Download(path string) (io.ReadCloser, error) {
	outFile, err := os.Open(path)
	if err != nil {
		return nil, errors.New("Error Reading File: " + err.Error())
	}
	return outFile, nil
}

func (c *Connection) Delete(path string) error {
	err := os.Remove(path)
	if err != nil {
		return errors.New("Error Reading File: " + err.Error())
	}
	// Now remove subfolders if they're empty
	removeEmptyDir(filepath.Dir(path))
	return nil
}
