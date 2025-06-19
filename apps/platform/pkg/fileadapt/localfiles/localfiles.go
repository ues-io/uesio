package localfiles

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// Skip .DS_Store files
var LocalFileIgnore = []string{".DS_Store"}

// For local files, returns true if the file should be ignored during processing, false otherwise
func ShouldIgnoreFile(fileName string) bool {
	return slices.ContainsFunc(LocalFileIgnore, func(name string) bool {
		return strings.EqualFold(name, fileName)
	})
}

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
	var paths []file.Metadata
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
		if ShouldIgnoreFile(info.Name()) {
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

func (c *Connection) Upload(fileData io.Reader, path string) (int64, error) {

	fullPath := filepath.Join(c.bucket, filepath.FromSlash(path))

	directory := filepath.Dir(fullPath)

	err := os.MkdirAll(directory, 0744)
	if err != nil {
		return 0, err
	}

	outFile, err := os.Create(fullPath)
	if err != nil {
		return 0, fmt.Errorf("error creating file: %w", err)
	}
	defer outFile.Close()
	size, err := io.Copy(outFile, fileData)
	if err != nil {
		return 0, fmt.Errorf("error writing file: %w", err)
	}

	return size, nil
}

func (c *Connection) Download(path string) (io.ReadSeekCloser, file.Metadata, error) {
	fullPath := filepath.Join(c.bucket, filepath.FromSlash(path))
	outFile, err := os.Open(fullPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil, exceptions.NewNotFoundException("file not found at path: " + path)
		} else {
			return nil, nil, fmt.Errorf("unable to read file at path '%s': %w", path, err)
		}
	}
	fileInfo, err := outFile.Stat()
	if err != nil {
		return nil, nil, err
	}
	return outFile, file.NewLocalFileMeta(fileInfo, path), nil
}

func (c *Connection) Delete(path string) error {
	fullPath := filepath.Join(c.bucket, filepath.FromSlash(path))
	err := os.Remove(fullPath)
	if err != nil {
		return fmt.Errorf("error reading file: %w", err)
	}
	// Now remove subfolders if they're empty
	removeEmptyDir(filepath.Dir(fullPath))
	return nil
}

func (c *Connection) EmptyDir(path string) error {
	fullPath := filepath.Join(c.bucket, filepath.FromSlash(path))
	err := os.RemoveAll(fullPath)
	if err != nil {
		return fmt.Errorf("error reading file: %w", err)
	}
	return nil
}
