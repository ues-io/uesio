package postgresio

import (
	"fmt"
	"log/slog"
	"net/url"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func getMigrationsDirectory() string {
	return "file://./migrations"
}
func getConnectionString(credentials *adapt.Credentials) (string, error) {
	host, err := credentials.GetRequiredEntry("host")
	if err != nil {
		return "", err
	}

	port := credentials.GetEntry("port", "5432")

	user, err := credentials.GetRequiredEntry("username")
	if err != nil {
		return "", err
	}

	password, err := credentials.GetRequiredEntry("password")
	if err != nil {
		return "", err
	}

	dbname, err := credentials.GetRequiredEntry("database")
	if err != nil {
		return "", err
	}
	// escape invalid url characters in the password
	password = url.PathEscape(password)

	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, password, host, port, dbname), nil
}

func (c *Connection) Migrate() error {
	slog.Info("Migrating database")

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
