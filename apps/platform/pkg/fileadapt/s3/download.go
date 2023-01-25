package s3

import (
	"bytes"
	"context"
	"errors"
	"io"
	"io/ioutil"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func (c *Connection) Download(path string) (time.Time, io.ReadCloser, error) {
	return c.DownloadWithDownloader(&s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	})
}

func (c *Connection) DownloadWithDownloader(input *s3.GetObjectInput) (time.Time, io.ReadCloser, error) {
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

	return *head.LastModified, ioutil.NopCloser(bytes.NewBuffer(buf)), nil
}

func (c *Connection) DownloadWithGetObject(input *s3.GetObjectInput) (time.Time, io.ReadCloser, error) {
	ctx := context.Background()
	result, err := c.client.GetObject(ctx, input)
	if err != nil {
		return time.Time{}, nil, errors.New("failed to retrieve Object")
	}

	return *result.LastModified, result.Body, nil
}
