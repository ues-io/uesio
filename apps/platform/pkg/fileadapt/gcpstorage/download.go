package gcpstorage

import (
	"context"
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/fileadapt"
)

func (a *FileAdapter) Download(bucket, path string, credentials *fileadapt.Credentials) (io.ReadCloser, error) {
	client, err := getClient(credentials)
	if err != nil {
		return nil, errors.New("invalid FileAdapterCredentials specified")
	}
	ctx := context.Background()
	rc, err := client.Bucket(bucket).Object(path).NewReader(ctx)
	if err != nil {
		return nil, errors.New("failed to retrieve Object")
	}

	return rc, nil
}
