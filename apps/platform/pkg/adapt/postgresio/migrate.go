package postgresio

import (
	"errors"
	"fmt"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func getMigrationsDirectory() string {
	return "file://./migrations"
}
func getConnectionString(credentials *adapt.Credentials) (string, error) {
	host, ok := (*credentials)["host"]
	if !ok {
		return "", errors.New("No host provided in credentials")
	}

	port, ok := (*credentials)["port"]
	if !ok {
		port = "5432"
	}

	user, ok := (*credentials)["user"]
	if !ok {
		return "", errors.New("No user provided in credentials")
	}

	password, ok := (*credentials)["password"]
	if !ok {
		return "", errors.New("No password provided in credentials")
	}

	dbname, ok := (*credentials)["database"]

	if !ok {
		return "", errors.New("No database name provided in credentials")
	}

	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, password, host, port, dbname), nil
}

func (c *Connection) Migrate() error {
	fmt.Println("Migrating Postgresio")

	migrationsDir := getMigrationsDirectory()

	connStr, err := getConnectionString(c.credentials)

	if err != nil {
		return err
	}

	m, err := migrate.New(
		migrationsDir,
		connStr)
	if err != nil {
		return err
	}
	err = m.Up()

	// If all migrations have run before, "no change" error will be returned, which is fine
	// so handle this case and move on without error
	if err != nil && err.Error() != "no change" {
		return err
	}

	return nil
}
