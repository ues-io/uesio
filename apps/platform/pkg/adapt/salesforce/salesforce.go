package salesforce

import (
	"errors"
	"sync"

	"github.com/simpleforce/simpleforce"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Adapter struct
type Adapter struct {
}

// TODO: Figure out a way to clean up and close unused clients
var clientPool = map[string]*simpleforce.Client{}
var lock sync.RWMutex

func connect(credentials *adapt.Credentials) (*simpleforce.Client, error) {
	hash := credentials.GetHash()
	// Check the pool for a client
	lock.RLock()
	client, ok := clientPool[hash]
	lock.RUnlock()
	if ok {
		return client, nil
	}
	return getConnection(credentials, hash)
}

func getConnection(credentials *adapt.Credentials, hash string) (*simpleforce.Client, error) {

	url, ok := (*credentials)["url"]
	if !ok {
		return nil, errors.New("No host provided in credentials")
	}

	user, ok := (*credentials)["user"]
	if !ok {
		return nil, errors.New("No user provided in credentials")
	}

	password, ok := (*credentials)["password"]
	if !ok {
		return nil, errors.New("No password provided in credentials")
	}

	token, ok := (*credentials)["token"]
	if !ok {
		return nil, errors.New("No token provided in credentials")
	}

	client := simpleforce.NewClient(url, simpleforce.DefaultClientID, simpleforce.DefaultAPIVersion)
	if client == nil {

		return nil, errors.New("Error getting salesforce client")
	}

	err := client.LoginPassword(user, password, token)
	if err != nil {
		return nil, err
	}

	lock.Lock()
	defer lock.Unlock()

	clientPool[hash] = client

	return client, nil
}

func getDBCollectionName(collectionMetadata *adapt.CollectionMetadata, tenantID string) (string, error) {
	if collectionMetadata.Name == "" {
		return "", errors.New("Could not get DB Collection Name: Missing important collection metadata: " + collectionMetadata.Name)
	}
	return collectionMetadata.Namespace + ":" + collectionMetadata.Name + ":" + tenantID, nil
}
