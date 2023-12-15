package s3

import (
	"errors"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/thecloudmasters/uesio/pkg/types/file"
)

// see https://stackoverflow.com/a/55788634
type FakeWriterAt struct {
	w io.Writer
}

func (fw FakeWriterAt) WriteAt(p []byte, offset int64) (n int, err error) {
	// ignore 'offset' because we forced sequential downloads
	return fw.w.Write(p)
}

type s3FileMeta struct {
	s3Output *s3.HeadObjectOutput
}

func newS3FileMeta(s3Output *s3.HeadObjectOutput) file.Metadata {
	return &s3FileMeta{s3Output}
}

func (fm *s3FileMeta) ContentLength() int64 {
	ptr := fm.s3Output.ContentLength
	if ptr != nil {
		return *ptr
	}
	return 0
}

func (fm *s3FileMeta) LastModified() *time.Time {
	return fm.s3Output.LastModified
}

func (c *Connection) Download(w io.Writer, path string) (file.Metadata, error) {
	return c.DownloadWithDownloader(FakeWriterAt{w}, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	})
}

func (c *Connection) DownloadWithDownloader(w io.WriterAt, input *s3.GetObjectInput) (file.Metadata, error) {
	downloader := manager.NewDownloader(c.client)
	downloader.Concurrency = 1
	head, err := c.client.HeadObject(c.ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    input.Key,
	})
	if err != nil {
		return nil, errors.New("failed to retrieve object information: " + err.Error())
	}

	_, err = downloader.Download(c.ctx, w, input)
	if err != nil {
		return nil, errors.New("failed to retrieve Object")
	}

	return newS3FileMeta(head), nil
}
