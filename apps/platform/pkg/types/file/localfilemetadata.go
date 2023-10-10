package file

import (
	"os"
	"time"
)

type localFileMeta struct {
	fileInfo os.FileInfo
}

func NewLocalFileMeta(info os.FileInfo) Metadata {
	return &localFileMeta{info}
}

func (fm *localFileMeta) ContentLength() int64 {
	return fm.fileInfo.Size()
}

func (fm *localFileMeta) LastModified() *time.Time {
	t := fm.fileInfo.ModTime()
	return &t
}
