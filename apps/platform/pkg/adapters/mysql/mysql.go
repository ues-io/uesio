package mysql

import (
	"database/sql"
	"errors"
	"fmt"

	_ "github.com/go-sql-driver/mysql" //needed for MySQL
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// Adapter struct
type Adapter struct {
}

const (
	host     = "localhost"
	port     = 3306
	user     = "root"
	password = "tcm"
	dbname   = "test-cf94a"
)

func connect() (*sql.DB, error) {
	psqlInfo := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", user, password, host, port, dbname)
	db, err := sql.Open("mysql", psqlInfo)

	rows, err := db.Query("SELECT * FROM user;")

	for rows.Next() {
		var (
			id        int
			firstname string
		)
		if err := rows.Scan(&id, &firstname); err != nil {
			panic(err)
		}
		fmt.Printf("%d is %s\n", id, firstname)
	}
	if err := rows.Err(); err != nil {
		panic(err)
	}

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
