package s3

import (
	"bytes"
	"context"
	"errors"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func (c *Connection) Download(path string) (time.Time, io.ReadSeeker, error) {
	return c.DownloadWithDownloader(&s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	})
}

func (c *Connection) DownloadWithDownloader(input *s3.GetObjectInput) (time.Time, io.ReadSeeker, error) {
	ctx := context.Background()
	downloader := manager.NewDownloader(c.client)
	head, err := c.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    input.Key,
	})

	if err != nil {
		return time.Time{}, nil, errors.New("failed to retrieve object information: " + err.Error())
	}

	buf := make([]byte, head.ContentLength)
	w := manager.NewWriteAtBuffer(buf)

	_, err = downloader.Download(ctx, w, input)

	if err != nil {
		return time.Time{}, nil, errors.New("failed to retrieve Object")
	}

	return *head.LastModified, bytes.NewReader(buf), nil
}
