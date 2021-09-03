package bundlestore

import (
	"bytes"
	"io"
)

// ItemStream struct
type ItemStream struct {
	Type     string
	FileName string
	Buffer   bytes.Buffer
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
