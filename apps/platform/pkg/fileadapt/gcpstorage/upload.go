package gcpstorage

import (
	"context"
	"errors"
	"io"
)

func (c *Connection) Upload(fileData io.Reader, path string) error {

	ctx := context.Background()
	objectName := path
	fsbucket := c.client.Bucket(c.bucket)
	_, err := fsbucket.Attrs(ctx)
	if err != nil {
		if err = fsbucket.Create(ctx, c.projectID, nil); err != nil {
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
