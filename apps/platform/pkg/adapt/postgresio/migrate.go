package postgresio

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"github.com/gofrs/uuid"
	"github.com/thecloudmasters/uesio/pkg/sess"
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

	db := c.GetClient()

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

	if err != nil && err.Error() != "no change" {
		return err
	}

	systemUserID, err := uuid.NewV7()
	if err != nil {
		return err
	}
	systemUserName := "system"
	timestamp := time.Now().Unix()

	// Now insert the system user
	tenantID := sess.MakeSiteTenantID("uesio/studio:prod")
	collectionName := "uesio/core.user"
	uniqueID := systemUserName
	fullRecordID := systemUserID

	var existingSystemUser string
	err = db.QueryRow(context.Background(), "select id from public.data where uniquekey=$1 AND collection=$2 AND tenant=$3", uniqueID, collectionName, tenantID).Scan(&existingSystemUser)
	if err != nil {
		fmt.Println("Creating System User...")
		// We couldn't find a system user let's insert one.
		data := map[string]interface{}{
			"uesio/core.type":      "PERSON",
			"uesio/core.profile":   "uesio/studio.standard",
			"uesio/core.firstname": "Super",
			"uesio/core.lastname":  "Admin",
			"uesio/core.username":  "system",
		}

		fieldJSON, err := json.Marshal(&data)
		if err != nil {
			return err
		}

		_, err = db.Exec(context.Background(), INSERT_QUERY, fullRecordID, uniqueID, systemUserID, systemUserID, systemUserID, timestamp, timestamp, collectionName, tenantID, 0, fieldJSON)
		if err != nil {
			return err
		}
	} else {
		fmt.Println("System User Already exists. Skipping.")
	}

	return nil
}
