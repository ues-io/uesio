package s3

import (
	"context"
	"errors"
	"io"

	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func (a *FileAdapter) Upload(fileData io.Reader, bucket, path string, credentials *adapt.Credentials) error {

	client, err := getS3Client(credentials)
	if err != nil {
		return errors.New("invalid FileAdapterCredentials specified: " + err.Error())
	}
	uploader := manager.NewUploader(client)

	_, err = uploader.Upload(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(path),
		Body:   fileData,
	})
	if err != nil {
		return err
	}
	return nil
}
