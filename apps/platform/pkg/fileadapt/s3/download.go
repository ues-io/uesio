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

	"github.com/thecloudmasters/uesio/pkg/fileadapt"
)

type s3FileMeta struct {
	s3Output *s3.HeadObjectOutput
}

func newS3FileMeta(s3Output *s3.HeadObjectOutput) fileadapt.FileMeta {
	return &s3FileMeta{s3Output}
}

func (fm *s3FileMeta) ContentLength() int64 {
	return fm.s3Output.ContentLength
}

func (fm *s3FileMeta) LastModified() *time.Time {
	return fm.s3Output.LastModified
}

func (c *Connection) Download(path string) (fileadapt.FileMeta, io.ReadSeeker, error) {
	return c.DownloadWithDownloader(&s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	})
}

func (c *Connection) DownloadWithDownloader(input *s3.GetObjectInput) (fileadapt.FileMeta, io.ReadSeeker, error) {
	ctx := context.Background()
	downloader := manager.NewDownloader(c.client)
	head, err := c.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    input.Key,
	})

	if err != nil {
		return nil, nil, errors.New("failed to retrieve object information: " + err.Error())
	}

	buf := make([]byte, head.ContentLength)
	w := manager.NewWriteAtBuffer(buf)

	_, err = downloader.Download(ctx, w, input)

	if err != nil {
		return nil, nil, errors.New("failed to retrieve Object")
	}

	return newS3FileMeta(head), bytes.NewReader(buf), nil
}
