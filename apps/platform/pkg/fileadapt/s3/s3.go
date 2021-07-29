package s3

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// FileAdapter struct
type FileAdapter struct {
}

func getConfig(region, accessKeyID, secretAccessKey, sessionToken string) (aws.Config, error) {
	if accessKeyID != "" && secretAccessKey != "" {
		return config.LoadDefaultConfig(context.TODO(), config.WithRegion(region), config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, sessionToken)))
	}
	return config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
}

func getS3Client(dbcreds *adapt.Credentials) (*s3.Client, error) {

	region, ok := (*dbcreds)["region"]
	if !ok {
		return nil, errors.New("No region provided in credentials")
	}

	accessKeyID := (*dbcreds)["accessKeyId"]
	secretAccessKey := (*dbcreds)["secretAccessKey"]
	sessionToken := (*dbcreds)["sessionToken"]

	cfg, err := getConfig(region, accessKeyID, secretAccessKey, sessionToken)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(cfg)
	return client, nil
}
