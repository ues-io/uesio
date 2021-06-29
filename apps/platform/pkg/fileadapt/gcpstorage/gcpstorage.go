package gcpstorage

import (
	"context"
	"errors"

	"cloud.google.com/go/storage"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"google.golang.org/api/option"
)

// FileAdapter struct
type FileAdapter struct {
}

// TODO: Figure out a way to clean up and close unused clients
var clientPool = map[string]*storage.Client{}

func getNewClient(ctx context.Context, credentials *adapt.Credentials) (*storage.Client, error) {
	apiKey, ok := (*credentials)["apikey"]
	if !ok {
		return nil, errors.New("No api key provided in credentials")
	}
	return storage.NewClient(
		ctx,
		option.WithCredentialsJSON([]byte(apiKey)),
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
