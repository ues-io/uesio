package s3

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func (a *FileAdapter) List(bucket, path string, credentials *adapt.Credentials) (*s3.ListObjectsV2Output, error) {
	ctx := context.Background()
	client, err := getS3Client(ctx, credentials)
	if err != nil {
		return nil, errors.New("invalid FileAdapterCredentials specified: " + err.Error())
	}

	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(path),
	}

	result, err := client.ListObjectsV2(ctx, input)
	if err != nil {
		return nil, err
	}

	if result.IsTruncated {
		return nil, errors.New("S3 Limit exceeded")
	}

	return result, nil

}
