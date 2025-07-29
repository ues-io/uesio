package s3

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type FileAdapter struct {
}

func (a *FileAdapter) GetFileConnection(ctx context.Context, credentials *wire.Credentials, bucket string) (file.Connection, error) {
	client, err := getS3Client(ctx, credentials)
	if err != nil {
		return nil, fmt.Errorf("invalid file adapter credentials specified: %w", err)
	}
	return &Connection{
		credentials: credentials,
		bucket:      bucket,
		client:      client,
	}, nil
}

type Connection struct {
	credentials *wire.Credentials
	bucket      string
	client      *s3.Client
}

// TODO: Figure out a way to clean up and close unused clients
var clientPool = map[string]*s3.Client{}

func getS3Client(ctx context.Context, dbcreds *wire.Credentials) (*s3.Client, error) {

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
