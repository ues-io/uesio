package s3

import (
	"bytes"
	"context"
	"errors"
	"io"
	"io/ioutil"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func (c *Connection) Download(path string) (io.ReadCloser, error) {
	ctx := context.Background()

	downloader := manager.NewDownloader(c.client)

	head, err := c.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	})

	if err != nil {
		return nil, errors.New("failed to retrieve object information: " + err.Error())
	}

	buf := make([]byte, head.ContentLength)
	w := manager.NewWriteAtBuffer(buf)

	input := &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	}

	_, err = downloader.Download(ctx, w, input)

	if err != nil {
		return nil, errors.New("failed to retrieve Object")
	}

	return ioutil.NopCloser(bytes.NewBuffer(buf)), nil
}
