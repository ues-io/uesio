#!/usr/bin/env bash

export PGDATABASE=pgtest
export PGUSER=pgtest
export PGPASSWORD=mysecretpassword
export PGHOST=localhost
export PGPORT=5432

export MIGRATIONS_PATH="file://$PWD/apps/platform/migrations"
export CONN_STR="postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE?sslmode=disable"

echo "migrations path is $MIGRATIONS_PATH"

set -e

# 1. Drop all tables in existing DB to ensure we have a clean state

psql -c "DROP TABLE IF EXISTS schema_migrations"
echo "dropped schema_migrations table"
psql -c "DROP TABLE IF EXISTS public.data"
echo "dropped data table"
psql -c "DROP TABLE IF EXISTS public.tokens"
echo "dropped tokens table"

# 2. Run migrations to get to stable-december-2022 starting point
migrate -source "$MIGRATIONS_PATH" -database "$CONN_STR" goto 1

echo "migrated to stable-december-2022 state"

# 3. Seed with stable-december-2022 sample data
psql --file apps/platform/migrations_test/stable-db-data.sql

echo "seeded with dummy data"

# 4. Run migrations to get to master/2023 state
migrate -source "$MIGRATIONS_PATH" -database "$CONN_STR" goto 2

# 5. Ensure system user is created
migrate -source "$MIGRATIONS_PATH" -database "$CONN_STR" goto 3

echo "Ran migration to get up to latest master state"

migrate -source "$MIGRATIONS_PATH" -database "$CONN_STR" version

# 5. Run some tests??
