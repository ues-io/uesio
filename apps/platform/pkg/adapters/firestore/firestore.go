package firestore

import (
	"context"
	"errors"
	"os"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/creds"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"
)

// Adapter struct
type Adapter struct {
}

// TODO: Figure out a way to clean up and close unused clients
var clientPool = map[string]*firestore.Client{}

const searchIndexField = "system:searchindex"

func getNewClient(ctx context.Context, credentials *creds.AdapterCredentials) (*firestore.Client, error) {
	if os.Getenv("FIRESTORE_EMULATOR_HOST") != "" {
		return firestore.NewClient(
			ctx,
			credentials.Database,
		)
	}
	return firestore.NewClient(
		ctx,
		credentials.Database,
		option.WithCredentialsJSON([]byte(credentials.Password)),
	)
}

func getClient(credentials *creds.AdapterCredentials) (*firestore.Client, error) {
	hash := credentials.GetHash()
	// Check the pool for a client
	client, ok := clientPool[hash]
	if !ok {
		// Get a Firestore client.
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

func getDBFieldName(fieldMetadata *adapters.FieldMetadata) (string, error) {
	if fieldMetadata.Namespace == "" || fieldMetadata.PropertyName == "" {
		return "", errors.New("Could not get DB Field Name: Missing important field metadata: " + fieldMetadata.Name)
	}
	return fieldMetadata.Namespace + ":" + fieldMetadata.PropertyName, nil
}

func getDBCollectionName(collectionMetadata *adapters.CollectionMetadata) (string, error) {
	if collectionMetadata.Namespace == "" || collectionMetadata.CollectionName == "" {
		return "", errors.New("Could not get DB Collection Name: Missing important collection metadata: " + collectionMetadata.Name)
	}
	return collectionMetadata.Namespace + ":" + collectionMetadata.CollectionName, nil
}
