package s3

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

func (c *Connection) Delete(ctx context.Context, path string) error {

	_, err := c.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	})

	if err != nil {
		return errors.New("failed to delete")
	}

	return nil
}

func (c *Connection) EmptyDir(ctx context.Context, path string) error {

	objKeys, err := c.List(ctx, path)
	if err != nil {
		return errors.New("failed to empty directory")
	}

	if len(objKeys) == 0 {
		return nil
	}

	s3Ids := make([]types.ObjectIdentifier, len(objKeys))
	for i, fileInfo := range objKeys {
		s3Ids[i] = types.ObjectIdentifier{Key: aws.String(path + fileInfo.Path())}
	}

	_, err = c.client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
		Bucket: aws.String(c.bucket),
		Delete: &types.Delete{
			Objects: s3Ids,
		},
	})

	if err != nil {
		return errors.New("failed to empty directory")
	}

	return nil

}
