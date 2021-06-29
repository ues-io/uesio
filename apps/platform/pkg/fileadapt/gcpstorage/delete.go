package gcpstorage

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func (a *FileAdapter) Delete(bucket string, path string, credentials *adapt.Credentials) error {
	client, err := getClient(credentials)
	if err != nil {
		return errors.New("invalid FileAdapterCredentials specified: " + err.Error())
	}
	ctx := context.Background()
	fsbucket := client.Bucket(bucket)
	_, err = fsbucket.Attrs(ctx)
	if err != nil {
		return errors.New("bucket does not exist for deletion")
	}
	err = fsbucket.Object(path).Delete(ctx)
	if err != nil {
		return errors.New("failed to delete")
	}

	return nil
}
