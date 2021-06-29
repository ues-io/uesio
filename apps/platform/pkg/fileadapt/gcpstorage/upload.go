package gcpstorage

import (
	"context"
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func (a *FileAdapter) Upload(fileData io.Reader, bucket, path string, credentials *adapt.Credentials) error {
	projectID, ok := (*credentials)["project"]
	if !ok {
		return errors.New("No project id provided in credentials")
	}
	client, err := getClient(credentials)
	if err != nil {
		return errors.New("Invalid FileAdapterCredentials specified: " + err.Error())
	}
	ctx := context.Background()
	objectName := path
	fsbucket := client.Bucket(bucket)
	_, err = fsbucket.Attrs(ctx)
	if err != nil {
		if err = fsbucket.Create(ctx, projectID, nil); err != nil {
			return err
		}
	}
	obj := fsbucket.Object(objectName)
	w := obj.NewWriter(ctx)
	defer w.Close()
	if _, err := io.Copy(w, fileData); err != nil {
		// TODO: Handle error.
		return errors.New("Error Uploading file")
	}
	return nil
}
