package file

import (
	"strings"
	"time"
)

type FileRequest struct {
	// The file path being requested, e.g. "runtime.js"
	Path string
	// The time at which this file was last modified in the service storing it
	LastModified time.Time
	// The bundle namespace where the file is stored
	Namespace string
	// The revision of the file being requested
	Version string
}

// if fileVersion is provided, this resource can be cached indefinitely,
// so inject long-lived caching headers.
// However, we need to know that the version is not static,
// which for uesio assets it is if its 0.0.1
func (fr *FileRequest) TreatAsImmutable() bool {
	return fr.Version != "" && (!strings.HasPrefix(fr.Namespace, "uesio/") || fr.Version != "v0.0.1")
}
