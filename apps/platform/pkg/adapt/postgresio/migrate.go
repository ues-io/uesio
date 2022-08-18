package postgresio

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Migrate function
func (c *Connection) Migrate() error {
	fmt.Println("Migrating Postgresio")
	db := c.GetClient()

	_, err := db.Exec(context.Background(), `
		create table if not exists public.data
		(
			id         varchar(255) not null primary key,
			uniquekey  varchar(255) not null unique,
			fields     jsonb,
			collection varchar(255) not null,
			tenant     varchar(255) not null,
			autonumber integer not null
		);

		create table if not exists public.tokens
		(
			fullid     varchar(255) not null,
			recordid   varchar(255) not null,
			token      varchar(255) not null,
			collection varchar(255) not null,
			tenant     varchar(255) not null,
			readonly   boolean not null
		);

		create index if not exists collection_idx on data (collection);
		create index if not exists tenant_idx on data (tenant);
		create unique index if not exists autonumber_idx on data (collection, autonumber);

		create index if not exists fullid_idx on tokens(fullid);
		create index if not exists recordid_idx on tokens (recordid);
		create index if not exists collection_idx on tokens (collection);
		create index if not exists tenant_idx on tokens (tenant);
	`)
	if err != nil {
		return err
	}

	systemUserID := uuid.New().String()
	systemUserName := "system"
	timestamp := time.Now().UnixMilli()

	// Now insert the system user
	tenantID := sess.MakeSiteTenantID("uesio/studio:prod")
	collectionName := makeDBId(tenantID, "uesio/core.user")
	uniqueID := makeDBId(collectionName, systemUserName)
	fullRecordID := makeDBId(collectionName, systemUserID)

	var existingSystemUser string
	err = db.QueryRow(context.Background(), "select id from public.data where uniquekey=$1", uniqueID).Scan(&existingSystemUser)
	if err != nil {
		fmt.Println("Creating System User...")
		// We couldn't find a system user let's insert one.
		data := map[string]interface{}{
			"uesio/core.id":        systemUserID,
			"uesio/core.type":      "PERSON",
			"uesio/core.owner":     systemUserID,
			"uesio/core.profile":   "uesio/studio.standard",
			"uesio/core.firstname": "Super",
			"uesio/core.lastname":  "Admin",
			"uesio/core.username":  "system",
			"uesio/core.createdat": timestamp,
			"uesio/core.createdby": systemUserID,
			"uesio/core.uniquekey": systemUserName,
			"uesio/core.updatedat": timestamp,
			"uesio/core.updatedby": systemUserID,
		}

		fieldJSON, err := json.Marshal(&data)
		if err != nil {
			return err
		}

		_, err = db.Exec(context.Background(), INSERT_QUERY, fullRecordID, uniqueID, collectionName, tenantID, 0, fieldJSON)
		if err != nil {
			return err
		}
	} else {
		fmt.Println("System User Already exists. Skipping.")
	}

	return nil
}
