package postgresio

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Adapter struct
type Adapter struct {
}

// TODO: Figure out a way to clean up and close unused clients
var clientPool = map[string]*pgxpool.Pool{}
var lock sync.RWMutex

func connect(credentials *adapt.Credentials) (*pgxpool.Pool, error) {
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

func makeDBId(suffix, prefix interface{}) string {
	return fmt.Sprintf("%s>%s", suffix, prefix)
}

func getConnection(credentials *adapt.Credentials, hash string) (*pgxpool.Pool, error) {
	host, ok := (*credentials)["host"]
	if !ok {
		return nil, errors.New("No host provided in credentials")
	}

	port, ok := (*credentials)["port"]
	if !ok {
		port = "5432"
	}

	user, ok := (*credentials)["user"]
	if !ok {
		return nil, errors.New("No user provided in credentials")
	}

	password, ok := (*credentials)["password"]
	if !ok {
		return nil, errors.New("No password provided in credentials")
	}

	dbname, ok := (*credentials)["database"]
	if !ok {
		return nil, errors.New("No database provided in credentials")
	}

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s "+"password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)

	db, err := pgxpool.Connect(context.Background(), psqlInfo)
	if err != nil {
		return nil, err
	}

	err = db.Ping(context.Background())
	if err != nil {
		return nil, err
	}

	lock.Lock()
	defer lock.Unlock()

	clientPool[hash] = db

	return db, nil
}

func getDBCollectionName(collectionMetadata *adapt.CollectionMetadata, tenantID string) (string, error) {
	if collectionMetadata.Name == "" {
		return "", errors.New("Could not get DB Collection Name: Missing important collection metadata: " + collectionMetadata.Name)
	}
	return makeDBId(tenantID, collectionMetadata.GetFullName()), nil
}
