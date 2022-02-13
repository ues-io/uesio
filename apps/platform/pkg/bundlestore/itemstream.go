package bundlestore

import (
	"bytes"
	"io"
)

type ItemStreams []ItemStream

func (is *ItemStreams) AddFile(fileName, fileType string) *bytes.Buffer {
	file := ItemStream{
		FileName: fileName,
		Type:     fileType,
		Buffer:   &bytes.Buffer{},
	}
	*is = append(*is, file)
	return file.Buffer
}

// ItemStream struct
type ItemStream struct {
	Type     string
	FileName string
	Buffer   *bytes.Buffer
}

// ReadItemStream struct
type ReadItemStream struct {
	Type     string
	FileName string
	Path     string
	Data     io.ReadCloser
}

// ItemResponse struct
type ItemResponse struct {
	io.Reader
	io.Closer
}
