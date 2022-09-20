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

type ItemStream struct {
	Type     string
	FileName string
	File     io.Reader
}

type ReadItemStream struct {
	Type     string
	FileName string
	Path     string
	Data     io.ReadCloser
}
