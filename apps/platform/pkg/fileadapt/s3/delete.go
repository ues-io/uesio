package s3

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func (c *Connection) Delete(path string) error {

	_, err := c.client.DeleteObject(context.Background(), &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	})

	if err != nil {
		return errors.New("failed to delete")
	}

	return nil
}

func (c *Connection) EmptyDir(path string) error {
	return nil
}
