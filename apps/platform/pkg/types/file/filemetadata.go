package file

import "time"

type Metadata interface {
	ContentLength() int64
	LastModified() *time.Time
}
