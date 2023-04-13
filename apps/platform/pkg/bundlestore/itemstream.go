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
