#!/bin/bash

set -e
set -u

password=$(echo $PGPASSWORD)

function create_user_and_database() {
	local database=$(echo $1 | tr ',' ' ' | awk  '{print $1}')
	local owner=$(echo $1 | tr ',' ' ' | awk  '{print $2}')
	echo "Creating user '$owner' and database '$database' with owner '$owner'"
	psql -v ON_ERROR_STOP=1 --username "postgres" <<-EOSQL
DO \$\$
BEGIN
CREATE ROLE $owner LOGIN PASSWORD '$password';
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE '%, skipping', SQLERRM USING ERRCODE = SQLSTATE;
END
\$\$
EOSQL
	psql -v --username "postgres" -c "CREATE DATABASE $database;"
	psql -v --username "postgres" -c "ALTER DATABASE $database OWNER TO $owner;"
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ':' ' '); do
		create_user_and_database $db
	done
	echo "Multiple databases created"
fi
