package gcpstorage

import (
	"context"
	"errors"

	"cloud.google.com/go/storage"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"google.golang.org/api/option"
)

// FileAdapter struct
type FileAdapter struct {
}

func (a *FileAdapter) GetFileConnection(credentials *adapt.Credentials, bucket string) (fileadapt.FileConnection, error) {
	projectID, ok := (*credentials)["project"]
	if !ok {
		return nil, errors.New("No project id provided in credentials")
	}
	client, err := getClient(credentials)
	if err != nil {
		return nil, errors.New("invalid FileAdapterCredentials specified: " + err.Error())
	}
	return &Connection{
		credentials: credentials,
		bucket:      bucket,
		client:      client,
		projectID:   projectID,
	}, nil
}

type Connection struct {
	credentials *adapt.Credentials
	bucket      string
	client      *storage.Client
	projectID   string
}

func (c *Connection) List(path string) ([]string, error) {
	return nil, nil
}

// TODO: Figure out a way to clean up and close unused clients
var clientPool = map[string]*storage.Client{}

func getNewClient(ctx context.Context, credentials *adapt.Credentials) (*storage.Client, error) {
	options := []option.ClientOption{}
	apiKey, ok := (*credentials)["apikey"]
	if ok && apiKey != "" {
		options = append(options, option.WithCredentialsJSON([]byte(apiKey)))
	}
	return storage.NewClient(
		ctx,
		options...,
	)
}

func getClient(credentials *adapt.Credentials) (*storage.Client, error) {
	hash := credentials.GetHash()
	// Check the pool for a client
	client, ok := clientPool[hash]
	if !ok {
		// Get a storage client.
		ctx := context.Background()

		newClient, err := getNewClient(ctx, credentials)
		if err != nil {
			return nil, errors.New("Failed to create client:" + err.Error())
		}

		clientPool[hash] = newClient
		return newClient, nil
	}
	return client, nil
}

//Stuff might be necessary here?
