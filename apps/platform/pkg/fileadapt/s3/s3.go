package s3

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/creds"
)

// FileAdapter struct
type FileAdapter struct {
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
