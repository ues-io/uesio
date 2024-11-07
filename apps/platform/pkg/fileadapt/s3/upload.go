package s3

import (
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type contentLengthReader struct {
	contentLength int64
	body          io.Reader
}

func newContentLengthReader(f io.Reader) *contentLengthReader {
	return &contentLengthReader{body: f}
}

func (r *contentLengthReader) Read(b []byte) (int, error) {
	n, err := r.body.Read(b)
	if err != nil && err != io.EOF {
		return n, err
	}
	r.contentLength += int64(n)
	return n, err
}

func (r *contentLengthReader) GetContentLength() int64 {
	return r.contentLength
}

func (c *Connection) Upload(fileData io.Reader, path string) (int64, error) {

	uploader := manager.NewUploader(c.client)

	reader := newContentLengthReader(fileData)

	_, err := uploader.Upload(c.ctx, &s3.PutObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(path),
		Body:   reader,
	})
	if err != nil {
		return 0, err
	}
	return reader.GetContentLength(), nil
}
