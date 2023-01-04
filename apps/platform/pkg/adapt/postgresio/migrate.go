package postgresio

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func (c *Connection) Migrate() error {
	fmt.Println("Migrating Postgresio")
	db := c.GetClient()

	_, err := db.Exec(context.Background(), `
		create table if not exists public.data
		(
			id         uuid           not null,
			collection varchar(255)   not null,
			tenant     varchar(255)   not null,
			uniquekey  varchar(255)   not null,
			fields     jsonb          not null,
			owner      uuid           not null,
			createdby  uuid           not null,
			updatedby  uuid           not null,
			createdat  timestamptz(0) not null,
			updatedat  timestamptz(0) not null,
			autonumber integer        not null,

			primary key(tenant,collection,id)
		);

		create table if not exists public.tokens
		(
			recordid   uuid         not null,
			collection varchar(255) not null,
			tenant     varchar(255) not null,
			token      varchar(255) not null,
			readonly   boolean      not null,

			primary key(tenant,collection,recordid,token)
		);

		create unique index if not exists unique_idx on data (tenant,collection,uniquekey);
		create unique index if not exists autonumber_idx on data (tenant,collection,autonumber);

		create index if not exists _idx on tokens (tenant,collection,recordid);

	`)
	if err != nil {
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
