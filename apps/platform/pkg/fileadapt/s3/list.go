package s3

import (
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/thecloudmasters/uesio/pkg/types/file"
)

type s3PaginatorFileMeta struct {
	s3Output types.Object
	path     string
}

func newS3PaginatorFileMeta(s3Output types.Object, path string) file.Metadata {
	return &s3PaginatorFileMeta{s3Output, path}
}

func (fm *s3PaginatorFileMeta) Path() string {
	return fm.path
}

func (fm *s3PaginatorFileMeta) ContentLength() int64 {
	ptr := fm.s3Output.Size
	if ptr != nil {
		return *ptr
	}
	return 0
}

func (fm *s3PaginatorFileMeta) LastModified() time.Time {
	return *fm.s3Output.LastModified
}

func (c *Connection) List(path string) ([]file.Metadata, error) {

	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(c.bucket),
		Prefix: aws.String(path),
	}

	paginator := s3.NewListObjectsV2Paginator(c.client, input)

	var paths []file.Metadata
	for paginator.HasMorePages() {
		result, err := paginator.NextPage(c.ctx)
		if err != nil {
			return nil, err
		}
		for _, fileMetadata := range result.Contents {
			paths = append(paths, newS3PaginatorFileMeta(fileMetadata, strings.TrimPrefix(*fileMetadata.Key, path)))
		}
	}

	return paths, nil

}
