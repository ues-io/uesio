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

	"github.com/dolmen-go/contextio"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"golang.org/x/sync/errgroup"
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
	}, nil
}

type Connection struct {
	bucket string
}

func (c *Connection) List(ctx context.Context, dirPath string) ([]file.Metadata, error) {
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

func (c *Connection) Upload(ctx context.Context, req file.FileUploadRequest) (int64, error) {
	return handleFileUpload(ctx, c.bucket, req.Data(), req.Path())
}

func (c *Connection) UploadMany(ctx context.Context, reqs []file.FileUploadRequest) ([]int64, error) {
	// TODO: make maxRequestUploadConcurrency configurable. This is a "per request" concurrency limit currently. Need
	// to "tune" it and also consider "host/site" wide configuration options beyond just individual request limits. The
	// configuration limits should likely be exposed at a "host" level (for all configuration limit options) for each
	// backend provider as the "host" instance and backend provider will have different resource limitations.
	maxRequestUploadConcurrency := 10
	g, uploadCtx := errgroup.WithContext(ctx)
	g.SetLimit(maxRequestUploadConcurrency)
	bytesWritten := make([]int64, len(reqs))

	for i, req := range reqs {
		g.Go(func() error {
			bytes, err := handleFileUpload(uploadCtx, c.bucket, req.Data(), req.Path())
			if err == nil {
				bytesWritten[i] = bytes
			}
			return err
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return bytesWritten, nil
}

func handleFileUpload(ctx context.Context, bucket string, fileData io.Reader, path string) (int64, error) {
	fullPath := filepath.Join(bucket, filepath.FromSlash(path))

	directory := filepath.Dir(fullPath)

	err := os.MkdirAll(directory, 0744)
	if err != nil {
		return 0, err
	}

	// Check if context is cancelled before creating the file
	select {
	case <-ctx.Done():
		return 0, ctx.Err()
	default:
	}

	outFile, err := os.Create(fullPath)
	if err != nil {
		return 0, fmt.Errorf("error creating file: %w", err)
	}
	defer outFile.Close()
	r := contextio.NewReader(ctx, fileData)
	w := contextio.NewWriter(ctx, outFile)
	size, err := io.Copy(w, r)
	if err != nil {
		return 0, fmt.Errorf("error writing file: %w", err)
	}

	return size, nil
}

func (c *Connection) Download(ctx context.Context, path string) (io.ReadSeekCloser, file.Metadata, error) {
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

func (c *Connection) Delete(ctx context.Context, path string) error {
	fullPath := filepath.Join(c.bucket, filepath.FromSlash(path))
	err := os.Remove(fullPath)
	if err != nil {
		return fmt.Errorf("error reading file: %w", err)
	}
	// Now remove subfolders if they're empty
	removeEmptyDir(filepath.Dir(fullPath))
	return nil
}

func (c *Connection) EmptyDir(ctx context.Context, path string) error {
	fullPath := filepath.Join(c.bucket, filepath.FromSlash(path))
	err := os.RemoveAll(fullPath)
	if err != nil {
		return fmt.Errorf("error reading file: %w", err)
	}
	return nil
}
