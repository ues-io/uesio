package s3

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/types/file"
)

type FileAdapter struct {
}

func (a *FileAdapter) GetFileConnection(credentials *adapt.Credentials, bucket string) (file.Connection, error) {
	client, err := getS3Client(context.Background(), credentials)
	if err != nil {
		return nil, errors.New("invalid FileAdapterCredentials specified: " + err.Error())
	}
	return &Connection{
		credentials: credentials,
		bucket:      bucket,
		client:      client,
	}, nil
}

type Connection struct {
	credentials *adapt.Credentials
	bucket      string
	client      *s3.Client
}

// TODO: Figure out a way to clean up and close unused clients
var clientPool = map[string]*s3.Client{}

func getS3Client(ctx context.Context, dbcreds *adapt.Credentials) (*s3.Client, error) {

	hash := dbcreds.GetHash()
	// Check the pool for a client
	client, ok := clientPool[hash]
	if ok {
		return client, nil
	}

	cfg, err := creds.GetAWSConfig(ctx, dbcreds)
	if err != nil {
		return nil, err
	}

	svc := s3.NewFromConfig(cfg)

	clientPool[hash] = svc
	return svc, nil
}
