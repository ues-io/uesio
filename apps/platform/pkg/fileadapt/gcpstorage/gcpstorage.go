package gcpstorage

import (
	"context"
	"errors"
	"os"

	"cloud.google.com/go/storage"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"google.golang.org/api/option"
)

// FileAdapter struct
type FileAdapter struct {
}

// TODO: Figure out a way to clean up and close unused clients
var clientPool = map[string]*storage.Client{}

func getNewClient(ctx context.Context, credentials *fileadapt.Credentials) (*storage.Client, error) {
	projectID := getProjectID()
	if projectID == "" {
		projectID = "test"
	}
	return storage.NewClient(
		ctx,
		option.WithCredentialsJSON([]byte(credentials.Password)),
	)
}

func getProjectID() string {
	return os.Getenv("GOOGLE_CLOUD_PROJECT")
}

func getClient(credentials *fileadapt.Credentials) (*storage.Client, error) {
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
