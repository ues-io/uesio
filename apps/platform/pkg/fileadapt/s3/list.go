package s3

import (
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func (c *Connection) List(path string) ([]string, error) {

	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(c.bucket),
		Prefix: aws.String(path),
	}

	paginator := s3.NewListObjectsV2Paginator(c.client, input)

	var paths []string
	for paginator.HasMorePages() {
		result, err := paginator.NextPage(c.ctx)
		if err != nil {
			return nil, err
		}
		for _, fileMetadata := range result.Contents {
			paths = append(paths, strings.TrimPrefix(*fileMetadata.Key, path))
		}
	}

	return paths, nil

}
