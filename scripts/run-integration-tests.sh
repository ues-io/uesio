#!/usr/bin/env bash

set -e

export UESIO_CLI_LOGIN_METHOD=uesio/core.mock
export UESIO_CLI_USERNAME=uesio
export UESIO_CLI_HOST="https://studio.uesio-dev.com:3000"

# Deploy the sample app using Uesio
cd libs/apps/uesio/tests

echo "Logging in to Studio as uesio user..."
uesio logout
uesio sethost
uesio login

# Delete and recreate the tests app and dev workspace
hurl -k --no-output --variable host=studio.uesio-dev.com --variable port=3000 hurl_seeds/*.hurl

#DEV workspace
echo "Configuring dev workspace..."
uesio work -n dev
echo "Deploying tests app to Studio dev workspace..."
uesio deploy
echo "Successfully deployed tests app to Studio. Upserting seed data into dev workspace..."
uesio upsert -f seed_data/animals.csv -s seed_data/animals_import.spec.json
uesio upsert -f seed_data/wire_conditions.csv -s seed_data/wire_conditions_import.spec.json

#truncatetests workspace
echo "Changing to truncatetests workspace..."
uesio work -n truncatetests
echo "Deploying tests app to Studio truncatetests workspace..."
uesio deploy
echo "Upserting seed data into truncatetests workspace..."
uesio upsert -f seed_data/wire_conditions.csv -s seed_data/wire_conditions_import.spec.json

echo "Successfully upserted seed data. Running tests..."

# Run specs
hurl --very-verbose -k --variable host=studio.uesio-dev.com --variable port=3000 --test hurl_specs/*.hurl
# Run field condition tests
hurl -k --variable host=studio.uesio-dev.com --variable port=3000 --test hurl_fields/*.hurl

# FYI if you want to view the output of the request made by a specific hurl spec,
# you can comment out the assertions of the last hurl request made in a hurl file, and then run the spec
# without the "--test" flag, like this
# hurl --very-verbose -k --variable host=studio.uesio-dev.com --variable port=3000 hurl_specs/wire_collection_dependencies.hurl

cd ../../../..