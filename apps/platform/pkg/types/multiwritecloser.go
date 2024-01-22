package types

import "io"

type multi struct {
	io.Writer
	cs []io.Closer
}

func MultiWriteCloser(ws ...io.Writer) io.WriteCloser {
	m := &multi{Writer: io.MultiWriter(ws...)}
	for _, w := range ws {
		if c, ok := w.(io.Closer); ok {
			m.cs = append(m.cs, c)
		}
	}
	return m
}

func (m *multi) Close() error {
	var first error
	for _, c := range m.cs {
		if err := c.Close(); err != nil && first == nil {
			first = err
		}
	}
	return first
}
