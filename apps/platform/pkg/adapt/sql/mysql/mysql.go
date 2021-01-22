package mysql

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql" //needed for MySQL
)

// Adapter struct
type Adapter struct {
}

const (
	host     = "localhost"
	port     = 3306
	user     = "root"
	password = "postgrestcm" //"tcm"
	dbname   = "test-cf94a"
)

func connect() (*sql.DB, error) {
	psqlInfo := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", user, password, host, port, dbname)
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
