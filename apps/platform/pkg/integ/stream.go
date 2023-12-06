package integ

type Stream struct {
	done  chan int64
	err   chan error
	chunk chan []byte
}

func NewStream() *Stream {
	return &Stream{
		done:  make(chan int64),
		err:   make(chan error),
		chunk: make(chan []byte),
	}
}

// Done returns a channel which will be written to when the stream is finished processing
// with the total number of bytes written
func (s *Stream) Done() chan int64 {
	return s.done
}

// Err returns a channel which will be written to if there is an error processing the stream
func (s *Stream) Err() chan error {
	return s.err
}

// Chunk returns a channel which will be written to with chunks of data from the stream
func (s *Stream) Chunk() chan []byte {
	return s.chunk
}
