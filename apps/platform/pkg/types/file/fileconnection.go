package file

import (
	"context"
	"io"
)

type FileUploadRequest interface {
	Data() io.Reader
	Path() string
}

func NewFileUploadRequest(fileData io.Reader, path string) FileUploadRequest {
	return &fileUploadRequest{
		FileData: fileData,
		FilePath: path,
	}
}

type fileUploadRequest struct {
	FileData io.Reader
	FilePath string
}

func (f *fileUploadRequest) Data() io.Reader {
	return f.FileData
}

func (f *fileUploadRequest) Path() string {
	return f.FilePath
}

type Connection interface {
	Upload(ctx context.Context, req FileUploadRequest) (int64, error)
	UploadMany(ctx context.Context, reqs []FileUploadRequest) ([]int64, error)
	Download(ctx context.Context, path string) (io.ReadSeekCloser, Metadata, error)
	Delete(ctx context.Context, path string) error
	List(ctx context.Context, path string) ([]Metadata, error)
	EmptyDir(ctx context.Context, path string) error
}
