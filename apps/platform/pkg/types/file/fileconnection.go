package file

import "io"

type Connection interface {
	Upload(fileData io.Reader, path string) (int64, error)
	Download(path string) (io.ReadSeekCloser, Metadata, error)
	Delete(path string) error
	List(path string) ([]Metadata, error)
	EmptyDir(path string) error
}
