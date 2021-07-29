package s3

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func (a *FileAdapter) Delete(bucket string, path string, credentials *adapt.Credentials) error {

	client, err := getS3Client(credentials)

	if err != nil {
		return errors.New("invalid FileAdapterCredentials specified: " + err.Error())
	}

	_, err = client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(path),
	})

	if err != nil {
		return errors.New("failed to delete")
	}

	return nil

}
