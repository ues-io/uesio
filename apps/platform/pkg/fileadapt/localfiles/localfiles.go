package localfiles

import (
	"context"
	"errors"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
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

func (a *FileAdapter) GetFileConnection(ctx context.Context, credentials *wire.Credentials, bucket string) (file.Connection, error) {
	return &Connection{
		bucket: bucket,
		ctx:    ctx,
	}, nil
}

type Connection struct {
	bucket string
	ctx    context.Context
}

func (c *Connection) List(dirPath string) ([]file.Metadata, error) {
	paths := []file.Metadata{}
	basePath := filepath.Join(c.bucket, filepath.FromSlash(dirPath)) + string(os.PathSeparator)
	err := filepath.WalkDir(basePath, func(path string, info fs.DirEntry, err error) error {
		if err != nil {
			// Ignore walking errors
			return nil
		}
		if info.IsDir() {
			return nil
		}
		if path == basePath {
			return nil
		}

		fileInfo, err := os.Stat(path)
		if err != nil {
			return err
		}
		paths = append(paths, file.NewLocalFileMeta(fileInfo, filepath.ToSlash(strings.TrimPrefix(path, basePath))))

		return nil
	})
	if err != nil {
		return nil, err
	}
	return paths, nil
}

func (c *Connection) Upload(fileData io.Reader, path string) error {

	fullPath := filepath.Join(c.bucket, filepath.FromSlash(path))

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

func (c *Connection) Download(w io.Writer, path string) (file.Metadata, error) {
	fullPath := filepath.Join(c.bucket, filepath.FromSlash(path))
	outFile, err := os.Open(fullPath)
	if err != nil {
		return nil, errors.New("unable to read file at path: " + path)
	}
	fileInfo, err := outFile.Stat()
	if err != nil {
		return nil, err
	}
	_, err = io.Copy(w, outFile)
	if err != nil {
		return nil, err
	}
	return file.NewLocalFileMeta(fileInfo, path), nil
}

func (c *Connection) Delete(path string) error {
	fullPath := filepath.Join(c.bucket, filepath.FromSlash(path))
	err := os.Remove(fullPath)
	if err != nil {
		return errors.New("Error Reading File: " + err.Error())
	}
	// Now remove subfolders if they're empty
	removeEmptyDir(filepath.Dir(fullPath))
	return nil
}

func (c *Connection) EmptyDir(path string) error {
	fullPath := filepath.Join(c.bucket, filepath.FromSlash(path))
	err := os.RemoveAll(fullPath)
	if err != nil {
		return errors.New("Error Reading File: " + err.Error())
	}
	return nil
}
