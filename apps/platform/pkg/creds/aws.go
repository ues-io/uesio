package creds

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getConfig(ctx context.Context, region, accessKeyID, secretAccessKey, sessionToken string) (aws.Config, error) {
	if accessKeyID != "" && secretAccessKey != "" {
		return config.LoadDefaultConfig(ctx, config.WithRegion(region), config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, sessionToken)))
	}
	return config.LoadDefaultConfig(ctx, config.WithRegion(region))
}

func GetAWSConfig(ctx context.Context, dbcreds *wire.Credentials) (aws.Config, error) {

	region, ok := (*dbcreds)["region"]
	if !ok {
		return aws.Config{}, errors.New("No region provided in credentials")
	}

	accessKeyID := (*dbcreds)["accessKeyId"]
	secretAccessKey := (*dbcreds)["secretAccessKey"]
	sessionToken := (*dbcreds)["sessionToken"]

	return getConfig(ctx, region, accessKeyID, secretAccessKey, sessionToken)

}
