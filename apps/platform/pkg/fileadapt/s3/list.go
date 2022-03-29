package s3

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func (c *Connection) List(path string) ([]string, error) {

	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(c.bucket),
		Prefix: aws.String(path),
	}

	result, err := c.client.ListObjectsV2(context.Background(), input)
	if err != nil {
		return nil, err
	}

	if result.IsTruncated {
		return nil, errors.New("S3 Limit exceeded")
	}

	var paths = make([]string, len(result.Contents))

	for i, fileMetadata := range result.Contents {
		paths[i] = *fileMetadata.Key
	}

	return paths, nil

}
