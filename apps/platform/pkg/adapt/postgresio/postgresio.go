package postgresio

import (
	"database/sql"
	"errors"
	"fmt"

	_ "github.com/lib/pq" //needed for Postgres
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Adapter struct
type Adapter struct {
}

func connect(credentials *adapt.Credentials) (*sql.DB, error) {
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
	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		return db, err
	}

	err = db.Ping()
	if err != nil {
		return db, err
	}

	return db, nil
}

func getDBCollectionName(collectionMetadata *adapt.CollectionMetadata, tenantID string) (string, error) {
	if collectionMetadata.CollectionName == "" {
		return "", errors.New("Could not get DB Collection Name: Missing important collection metadata: " + collectionMetadata.Name)
	}
	return collectionMetadata.Namespace + ":" + collectionMetadata.CollectionName + ":" + tenantID, nil
}
