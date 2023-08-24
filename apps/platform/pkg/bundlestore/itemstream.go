package bundlestore

import (
	"io"

	"golang.org/x/sync/errgroup"
)

func GetFileReader(writeFunc func(io.Writer) error) (io.Reader, error) {
	g := new(errgroup.Group)
	r, w := io.Pipe()
	g.Go(func() error {
		err := writeFunc(w)
		if err != nil {
			w.Close()
			return err
		}
		w.Close()
		return nil
	})
	return r, g.Wait()
}
