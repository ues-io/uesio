package s3

import (
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

func (c *Connection) Delete(path string) error {

	_, err := c.client.DeleteObject(c.ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	})

	if err != nil {
		return errors.New("failed to delete")
	}

	return nil
}

func (c *Connection) EmptyDir(path string) error {

	objKeys, err := c.List(path)
	if err != nil {
		return errors.New("failed to EmptyDir")
	}

	if len(objKeys) == 0 {
		return nil
	}

	s3Ids := make([]types.ObjectIdentifier, len(objKeys))
	for i, key := range objKeys {
		s3Ids[i] = types.ObjectIdentifier{Key: aws.String(path + key)}
	}

	_, err = c.client.DeleteObjects(c.ctx, &s3.DeleteObjectsInput{
		Bucket: aws.String(c.bucket),
		Delete: &types.Delete{
			Objects: s3Ids,
		},
	})

	if err != nil {
		return errors.New("failed to EmptyDir")
	}

	return nil

}
