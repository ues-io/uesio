package file

import (
	"encoding/json"
	"mime"
	"path"
	"time"
)

type Metadata interface {
	ContentLength() int64
	LastModified() *time.Time
	Path() string
}

type MetadataWrapper struct {
	Metadata
}

func (m MetadataWrapper) MarshalJSON() ([]byte, error) {
	type metadataJSON struct {
		FileSize int64      `json:"filesize"`
		Path     string     `json:"path"`
		Modified *time.Time `json:"modified"`
		MimeType string     `json:"mimetype"`
	}

	filePath := m.Metadata.Path()

	return json.Marshal(metadataJSON{
		FileSize: m.Metadata.ContentLength(),
		Path:     filePath,
		Modified: m.Metadata.LastModified(),
		MimeType: mime.TypeByExtension(path.Ext(filePath)),
	})
}
