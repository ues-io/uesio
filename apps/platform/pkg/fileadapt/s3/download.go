package s3

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
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
	path     string
}

func newS3FileMeta(s3Output *s3.HeadObjectOutput, path string) file.Metadata {
	return &s3FileMeta{s3Output, path}
}

func (fm *s3FileMeta) Path() string {
	return fm.path
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
	return c.DownloadWithDownloader(FakeWriterAt{w}, path)
}

func (c *Connection) DownloadWithDownloader(w io.WriterAt, path string) (file.Metadata, error) {
	downloader := manager.NewDownloader(c.client)
	downloader.Concurrency = 1

	head, err := c.client.HeadObject(c.ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	})
	if err != nil {
		// HeadObject docs indicates it returns types.NotFound error but REST API docs indicate it should be NoSuchKey
		// and what it returns has changed over time and different APIs return different things for 404.  Playing it
		// safe and inspecting status code directly.
		var respErr *awshttp.ResponseError
		if errors.As(err, &respErr) && respErr.HTTPStatusCode() == http.StatusNotFound {
			return nil, exceptions.NewNotFoundException("object information not found at path: " + path)
		}
		return nil, fmt.Errorf("unable to retrieve object information at path '%s': %w", path, err)
	}

	_, err = downloader.Download(c.ctx, w, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
	})
	if err != nil {
		// Download docs indicates it returns types.NoSuchKey error which match REST API docs but HeadObject
		// returns NotFound even though REST docs indicate NoSuchKey. Playing itsafe and inspecting status code directly.
		var respErr *awshttp.ResponseError
		if errors.As(err, &respErr) && respErr.HTTPStatusCode() == http.StatusNotFound {
			return nil, exceptions.NewNotFoundException("object not found at path: " + path)
		}
		return nil, fmt.Errorf("unable to retrieve object at path '%s': %w", path, err)
	}

	return newS3FileMeta(head, path), nil
}
