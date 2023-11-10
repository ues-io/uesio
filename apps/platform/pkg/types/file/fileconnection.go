package file

import "io"

type Connection interface {
	Upload(fileData io.Reader, path string) error
	Download(fileData io.Writer, path string) (Metadata, error)
	Delete(path string) error
	List(path string) ([]string, error)
	EmptyDir(path string) error
}
