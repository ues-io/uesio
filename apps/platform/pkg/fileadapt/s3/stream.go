package s3

import (
	"context"
	"errors"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/thecloudmasters/uesio/pkg/types/file"
)

// NOTE: Code copied from https://github.com/nikolaydubina/aws-s3-reader

var CHUNK_POLICY = FixedChunkSizePolicy{Size: 1 << 20 * 40}

// ChunkSizePolicy is something that can tell how much data to fetch in single request for given S3 Object.
// With more advanced policies, Visit methods will be integrated.
type ChunkSizePolicy interface {
	ChunkSize() int
}

// FixedChunkSizePolicy always returns same chunk size.
type FixedChunkSizePolicy struct {
	Size int
}

func (s FixedChunkSizePolicy) ChunkSize() int { return s.Size }

// S3ReadSeeker is a reader of given S3 Object.
// It utilizes HTTP Byte Ranges to read chunks of data from S3 Object.
// It uses zero-memory copy from underlying HTTP Body response.
// It uses early HTTP Body termination, if seeks are beyond current HTTP Body.
// It uses adaptive policy for chunk size fetching.
// This is useful for iterating over very large S3 Objects.
type S3ReadSeeker struct {
	s3client        *s3.Client
	bucket          string
	key             string
	offset          int64                // in s3 object
	headInfo        *s3.HeadObjectOutput // in s3 object
	lastByte        int64                // in s3 object that we expect to have in current HTTP Body
	chunkSizePolicy ChunkSizePolicy
	r               io.ReadCloser // temporary holder for current reader
	sink            []byte        // where to read bytes discarding data from readers during in-body seek
	ctx             context.Context
}

func NewS3ReadSeeker(
	ctx context.Context,
	s3client *s3.Client,
	bucket string,
	key string,
	chunkSizePolicy ChunkSizePolicy,
) *S3ReadSeeker {
	return &S3ReadSeeker{
		s3client:        s3client,
		bucket:          bucket,
		key:             key,
		chunkSizePolicy: chunkSizePolicy,
	}
}

// Seek assumes always can seek to position in S3 object.
// Seeking beyond S3 file size will result failures in Read calls.
func (s *S3ReadSeeker) Seek(offset int64, whence int) (int64, error) {
	discardBytes := 0

	switch whence {
	case io.SeekCurrent:
		discardBytes = int(offset)
		s.offset += offset
	case io.SeekStart:
		// seeking backwards results in dropping current http body.
		// since http body reader can read only forwards.
		if offset < s.offset {
			s.reset()
		}
		discardBytes = int(offset - s.offset)
		s.offset = offset
	case io.SeekEnd:
		if offset > 0 {
			return 0, errors.New("cannot seek beyond end")
		}
		size, err := s.getSize()
		if err != nil {
			return 0, err
		}
		noffset := size + offset
		discardBytes = int(noffset - s.offset)
		s.offset = noffset
	default:
		return 0, errors.New("unsupported whence")
	}

	if s.offset > s.lastByte {
		s.reset()
		discardBytes = 0
	}

	if discardBytes > 0 {
		// not seeking
		if discardBytes > len(s.sink) {
			s.sink = make([]byte, discardBytes)
		}
		n, err := s.r.Read(s.sink[:discardBytes])
		if err != nil || n < discardBytes {
			s.reset()
		}
	}

	return s.offset, nil
}

func (s *S3ReadSeeker) Close() error {
	if s.r != nil {
		return s.r.Close()
	}
	return nil
}

func (s *S3ReadSeeker) Read(b []byte) (int, error) {
	if s.r == nil {
		if err := s.fetch(s.chunkSizePolicy.ChunkSize()); err != nil {
			return 0, err
		}
	}

	n, err := s.r.Read(b)
	s.offset += int64(n)

	if err != nil && errors.Is(err, io.EOF) {
		return n, s.fetch(s.chunkSizePolicy.ChunkSize())
	}

	return n, err
}

func (s *S3ReadSeeker) reset() {
	if s.r != nil {
		s.r.Close()
	}
	s.r = nil
	s.lastByte = 0
}

func (s *S3ReadSeeker) getSize() (int64, error) {
	if s.headInfo != nil {
		return *s.headInfo.ContentLength, nil
	}
	headInfo, err := s.getHeadInfo()
	if err != nil {
		return 0, err
	}
	return *headInfo.ContentLength, nil
}

func (s *S3ReadSeeker) getHeadInfo() (*s3.HeadObjectOutput, error) {
	if s.headInfo != nil {
		return s.headInfo, nil
	}
	resp, err := s.s3client.HeadObject(s.ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(s.key),
	})
	if err != nil {
		return nil, err
	}
	s.headInfo = resp
	return resp, nil
}

func (s *S3ReadSeeker) fetch(n int) error {
	s.reset()
	size, err := s.getSize()
	if err != nil {
		return err
	}
	n = min(n, int(size)-int(s.offset))
	if n <= 0 {
		return io.EOF
	}

	// note, that HTTP Byte Ranges is inclusive range of start-byte and end-byte
	s.lastByte = s.offset + int64(n) - 1
	resp, err := s.s3client.GetObject(s.ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(s.key),
		Range:  aws.String(fmt.Sprintf("bytes=%d-%d", s.offset, s.lastByte)),
	})
	if err != nil {
		return fmt.Errorf("cannot fetch bytes=%d-%d: %w", s.offset, s.lastByte, err)
	}
	s.r = resp.Body
	return nil
}

func (c *Connection) Stream(path string) (io.ReadSeeker, file.Metadata, error) {
	stream := NewS3ReadSeeker(c.ctx, c.client, c.bucket, path, CHUNK_POLICY)
	headInfo, err := stream.getHeadInfo()
	if err != nil {
		return nil, nil, err
	}
	return stream, newS3FileMeta(headInfo, path), nil
}
