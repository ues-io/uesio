package file

import (
	"os"
	"time"
)

type localFileMeta struct {
	fileInfo os.FileInfo
	path     string
}

func NewLocalFileMeta(info os.FileInfo, path string) Metadata {
	return &localFileMeta{info, path}
}

func (fm *localFileMeta) ContentLength() int64 {
	return fm.fileInfo.Size()
}

func (fm *localFileMeta) LastModified() *time.Time {
	t := fm.fileInfo.ModTime()
	return &t
}

func (fm *localFileMeta) Path() string {
	return fm.path
}
