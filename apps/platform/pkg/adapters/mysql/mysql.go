package mysql

import (
	"database/sql"
	"errors"
	"fmt"

	_ "github.com/lib/pq" //needed for Postgres
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// Adapter struct
type Adapter struct {
}

const (
	host     = "localhost"
	port     = 8889
	user     = "root"
	password = "root"
	dbname   = "test-cf94a"
)

func connect() (*sql.DB, error) {
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s "+"password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)
	db, err := sql.Open("mysql", psqlInfo)
	if err != nil {
		return db, err
	}

	err = db.Ping()
	if err != nil {
		return db, err
	}

	return db, nil
}

func getDBFieldName(fieldMetadata *adapters.FieldMetadata) (string, error) {
	if fieldMetadata.PropertyName == "" {
		return "", errors.New("Could not get DB Field Name: Missing important field metadata: " + fieldMetadata.Name)
	}
	return fieldMetadata.PropertyName, nil
}

func getDBCollectionName(collectionMetadata *adapters.CollectionMetadata) (string, error) {
	if collectionMetadata.CollectionName == "" {
		return "", errors.New("Could not get DB Collection Name: Missing important collection metadata: " + collectionMetadata.Name)
	}
	return collectionMetadata.CollectionName, nil
}
