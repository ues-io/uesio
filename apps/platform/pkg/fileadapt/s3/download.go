package s3

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"gocloud.dev/blob"
	"gocloud.dev/blob/s3blob"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/file"
)

type s3FileMeta struct {
	s3Output *blob.Reader
	path     string
}

func newS3FileMeta(s3Output *blob.Reader, path string) file.Metadata {
	return &s3FileMeta{s3Output, path}
}

func (fm *s3FileMeta) Path() string {
	return fm.path
}

func (fm *s3FileMeta) ContentLength() int64 {
	return fm.s3Output.Size()
}

func (fm *s3FileMeta) LastModified() time.Time {
	return fm.s3Output.ModTime()
}

func (c *Connection) Download(path string) (io.ReadSeekCloser, file.Metadata, error) {
	bucket, err := s3blob.OpenBucketV2(c.ctx, c.client, c.bucket, nil)
	if err != nil {
		return nil, nil, err
	}
	defer bucket.Close()

	r, err := bucket.NewReader(c.ctx, path, nil)
	if err != nil {
		var respErr *awshttp.ResponseError
		if errors.As(err, &respErr) && respErr.HTTPStatusCode() == http.StatusNotFound {
			return nil, nil, exceptions.NewNotFoundException("object not found at path: " + path)
		}
		return nil, nil, fmt.Errorf("unable to retrieve object at path '%s': %w", path, err)
	}

	// NOTE - The metadata will be based on the result of NewReader which defaults to the entire
	// blob so contentlength will be the full size of the object.
	return r, newS3FileMeta(r, path), nil
}
