package postgresio

import (
	"context"
	"fmt"
)

// Migrate function
func (c *Connection) Migrate() error {
	fmt.Println("Migrating Postgresio")
	db := c.GetClient()

	_, err := db.Exec(context.Background(), `
		create table if not exists public.data
		(
			id         varchar(255) not null constraint data_pk primary key,
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

	return nil
}
