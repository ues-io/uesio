package s3

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"io/ioutil"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func (a *FileAdapter) Download(bucket, path string, credentials *adapt.Credentials) (io.ReadCloser, error) {
	client, err := getS3Client(credentials)
	if err != nil {
		return nil, errors.New("invalid FileAdapterCredentials specified: " + err.Error())
	}

	ctx := context.Background()
	downloader := manager.NewDownloader(client)

	fmt.Println("bucket: " + bucket)
	fmt.Println("path: " + path)

	head, err := client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(path),
	})

	if err != nil {
		return nil, errors.New("failed to retrieve object information: " + err.Error())
	}

	buf := make([]byte, head.ContentLength)
	w := manager.NewWriteAtBuffer(buf)

	input := &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(path),
	}

	_, err = downloader.Download(ctx, w, input)

	if err != nil {
		return nil, errors.New("failed to retrieve Object")
	}

	return ioutil.NopCloser(bytes.NewBuffer(buf)), nil
}
