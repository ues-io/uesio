package reqs

import (
	"bytes"
	"io"
)

// ItemStream struct
type ItemStream struct {
	Path   string
	Buffer bytes.Buffer
}

// ItemResponse struct
type ItemResponse struct {
	io.Reader
	io.Closer
}
