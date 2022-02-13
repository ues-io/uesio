package bundlestore

import (
	"fmt"
	"io"
)

func GetFileReader(writeFunc func(io.Writer) error) io.Reader {
	r, w := io.Pipe()
	go func() {
		err := writeFunc(w)
		if err != nil {
			fmt.Println(err.Error())
		}
		w.Close()
	}()
	return r
}

type ItemStreams []ItemStream

func (is *ItemStreams) AddFile(fileName, fileType string, stream io.Reader) {
	file := ItemStream{
		FileName: fileName,
		Type:     fileType,
		File:     stream,
	}
	*is = append(*is, file)
}

// ItemStream struct
type ItemStream struct {
	Type     string
	FileName string
	File     io.Reader
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
