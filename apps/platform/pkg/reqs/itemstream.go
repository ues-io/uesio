package reqs

import "bytes"

// ItemStream struct
type ItemStream struct {
	Path   string
	Buffer bytes.Buffer
}
