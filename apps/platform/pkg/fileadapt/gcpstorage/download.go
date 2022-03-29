package gcpstorage

import (
	"context"
	"errors"
	"io"
)

func (c *Connection) Download(path string) (io.ReadCloser, error) {

	rc, err := c.client.Bucket(c.bucket).Object(path).NewReader(context.Background())
	if err != nil {
		return nil, errors.New("failed to retrieve Object")
	}

	return rc, nil
}
