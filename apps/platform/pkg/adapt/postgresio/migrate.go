package postgresio

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Migrate function
func (a *Adapter) Migrate(credentials *adapt.Credentials) error {
	fmt.Println("Migrating Postgresio")
	db, err := connect(credentials)
	if err != nil {
		return errors.New("Failed to connect to PostgreSQL:" + err.Error())
	}

	_, err = db.Exec(`
		create table if not exists public.data
		(
			id         varchar(255) not null constraint data_pk primary key,
			fields     jsonb,
			collection varchar(255) not null,
			autonumber integer not null
		);
		create table if not exists public.tokens
		(
			recordid varchar(255) not null,
			token varchar(255) not null,
			readonly boolean not null
		);
		create index if not exists collection_idx on data (collection);
		create unique index if not exists autonumber_idx on data (collection, autonumber);
	`)
	if err != nil {
		return err
	}

	return nil
}
