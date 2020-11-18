package postgresql

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq" //needed for Postgres
)

// Adapter struct
type Adapter struct {
}

const (
	host     = "localhost"
	port     = 5432
	user     = "postgres"
	password = "postgrestcm"
	dbname   = "test-cf94a"
)

func connect() (*sql.DB, error) {
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s "+"password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)
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
