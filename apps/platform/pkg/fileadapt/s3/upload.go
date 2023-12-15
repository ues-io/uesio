package s3

import (
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func (c *Connection) Upload(fileData io.Reader, path string) error {

	uploader := manager.NewUploader(c.client)

	_, err := uploader.Upload(c.ctx, &s3.PutObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
		Body:   fileData,
	})
	if err != nil {
		return err
	}
	return nil
}
