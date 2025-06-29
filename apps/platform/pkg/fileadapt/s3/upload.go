package s3

import (
	"context"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"golang.org/x/sync/errgroup"
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

func (c *Connection) Upload(req file.FileUploadRequest) (int64, error) {
	uploader := manager.NewUploader(c.client)
	return handleFileUpload(c.ctx, uploader, c.bucket, req.Data(), req.Path())
}

func (c *Connection) UploadMany(reqs []file.FileUploadRequest) ([]int64, error) {
	uploader := manager.NewUploader(c.client)

	// TODO: make maxConcurrency configurable
	maxConcurrency := 5
	g := &errgroup.Group{}
	g, uploadCtx := errgroup.WithContext(c.ctx)
	g.SetLimit(maxConcurrency)
	bytesWritten := make([]int64, len(reqs))

	for i, req := range reqs {
		g.Go(func() error {
			size, err := handleFileUpload(uploadCtx, uploader, c.bucket, req.Data(), req.Path())
			if err == nil {
				bytesWritten[i] = size
			}
			return err
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return bytesWritten, nil
}

func handleFileUpload(ctx context.Context, uploader *manager.Uploader, bucket string, fileData io.Reader, path string) (int64, error) {
	reader := newContentLengthReader(fileData)

	_, err := uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(path),
		Body:   reader,
	})
	if err != nil {
		return 0, err
	}
	return reader.GetContentLength(), nil
}
