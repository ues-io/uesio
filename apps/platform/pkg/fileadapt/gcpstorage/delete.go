package gcpstorage

import (
	"context"
	"errors"
)

func (c *Connection) Delete(path string) error {
	fsbucket := c.client.Bucket(c.bucket)
	ctx := context.Background()
	_, err := fsbucket.Attrs(ctx)
	if err != nil {
		return errors.New("bucket does not exist for deletion")
	}
	err = fsbucket.Object(path).Delete(ctx)
	if err != nil {
		return errors.New("failed to delete")
	}

	return nil
}

func (c *Connection) EmptyDir(path string) error {
	return nil
}
