package localfiles

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
)

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

func (a *FileAdapter) GetFileConnection(credentials *adapt.Credentials, bucket string) (fileadapt.FileConnection, error) {
	return &Connection{
		bucket: bucket,
	}, nil
}

type Connection struct {
	credentials *adapt.Credentials
	bucket      string
}

func (c *Connection) List(dirPath string) ([]string, error) {
	paths := []string{}
	basePath := filepath.Join(c.bucket, dirPath) + string(os.PathSeparator)
	err := filepath.Walk(basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			// Ignore walking errors
			return nil
		}
		if path == basePath {
			return nil
		}
		paths = append(paths, strings.TrimPrefix(path, basePath))

		return nil
	})
	if err != nil {
		return nil, err
	}
	return paths, nil
}

func (c *Connection) Upload(fileData io.Reader, path string) error {

	fullPath := filepath.Join(c.bucket, path)

	directory := filepath.Dir(fullPath)

	err := os.MkdirAll(directory, 0744)
	if err != nil {
		return err
	}

	outFile, err := os.Create(fullPath)
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

func (c *Connection) Download(path string) (fileadapt.FileMeta, io.ReadSeeker, error) {
	fullPath := filepath.Join(c.bucket, path)
	outFile, err := os.Open(fullPath)
	if err != nil {
		fmt.Println("Error Reading File: " + err.Error())
		return time.Time{}, strings.NewReader(""), nil
	}
	fileInfo, err := outFile.Stat()
	if err != nil {
		return time.Time{}, nil, err
	}
	return fileInfo.ModTime(), outFile, nil
}

func (c *Connection) Delete(path string) error {
	fullPath := filepath.Join(c.bucket, path)
	err := os.Remove(fullPath)
	if err != nil {
		return errors.New("Error Reading File: " + err.Error())
	}
	// Now remove subfolders if they're empty
	removeEmptyDir(filepath.Dir(fullPath))
	return nil
}

func (c *Connection) EmptyDir(path string) error {
	fullPath := filepath.Join(c.bucket, path)
	err := os.RemoveAll(fullPath)
	if err != nil {
		return errors.New("Error Reading File: " + err.Error())
	}
	return nil
}
