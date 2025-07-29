package postgresio

import (
	"context"
	"fmt"
	"log/slog"
	"net/url"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"github.com/thecloudmasters/uesio/pkg/types/migrations"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getMigrationsDirectory() string {
	return "file://./migrations"
}
func getConnectionString(credentials *wire.Credentials) (string, error) {
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

	sslmode, err := credentials.GetRequiredEntry("sslmode")
	if err != nil {
		return "", err
	}
	// escape invalid url characters in the password
	password = url.PathEscape(password)

	return fmt.Sprintf("pgx5://%s:%s@%s:%s/%s?sslmode=%s", user, password, host, port, dbname, sslmode), nil
}

func (c *Connection) Migrate(ctx context.Context, options *migrations.MigrateOptions) error {
	if options.Down {
		if options.Number >= 1 {
			slog.Info(fmt.Sprintf("Reverting %d previously-run migrations", options.Number))
		} else {
			slog.Info("Reverting all previously-run migrations")
		}
	} else {
		if options.Number >= 1 {
			slog.Info(fmt.Sprintf("Running next %d migrations", options.Number))
		} else {
			slog.Info("Running migrations")
		}
	}
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
	if options.Number == 0 {
		if options.Down {
			err = m.Down()
		} else {
			err = m.Up()
		}
	} else {
		if options.Down {
			err = m.Steps(options.Number * -1)
		} else {
			err = m.Steps(options.Number)
		}
	}
	// If all migrations have run before, "no change" error will be returned, which is fine
	// so handle this case and move on without error
	if err != nil && err.Error() != "no change" {
		return err
	}

	return nil
}
