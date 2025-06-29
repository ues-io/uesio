package file

import (
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
	Upload(req FileUploadRequest) (int64, error)
	UploadMany(reqs []FileUploadRequest) ([]int64, error)
	Download(path string) (io.ReadSeekCloser, Metadata, error)
	Delete(path string) error
	List(path string) ([]Metadata, error)
	EmptyDir(path string) error
}
