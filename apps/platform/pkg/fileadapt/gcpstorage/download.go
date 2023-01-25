package gcpstorage

import (
	"context"
	"errors"
	"io"
	"time"
)

func (c *Connection) Download(path string) (time.Time, io.ReadCloser, error) {

	rc, err := c.client.Bucket(c.bucket).Object(path).NewReader(context.Background())
	if err != nil {
		return time.Time{}, nil, errors.New("failed to retrieve Object")
	}

	return rc.Attrs.LastModified, rc, nil
}
