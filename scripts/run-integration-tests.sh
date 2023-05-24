#!/usr/bin/env bash

set -e

# Delete and recreate the tests app and dev workspace
hurl -k --no-output --variable host=studio.uesio-dev.com --variable port=3000 libs/apps/uesio/tests/hurl_seeds/*.hurl

export UESIO_CLI_LOGIN_METHOD=uesio/core.mock
export UESIO_CLI_USERNAME=uesio
export UESIO_CLI_HOST="https://studio.uesio-dev.com:3000"

# Deploy the sample app using Uesio
cd libs/apps/uesio/tests

echo "Logging in to Studio as uesio user..."
uesio logout
uesio sethost
uesio login
echo "Configuring workspace..."
uesio work
echo "Deploying tests app to Studio..."
uesio deploy
echo "Successfully deployed tests app to Studio. Upserting seed data..."
uesio upsert -f seed_data/animals.csv -s seed_data/animals_import.spec.json
echo "Successfully upserted seed data. Running tests..."

cd ../../../..

# Run specs
hurl -k --variable host=studio.uesio-dev.com --variable port=3000 --test libs/apps/uesio/tests/hurl_specs/*.hurl

# FYI if you want to view the output of the request made by a specific hurl spec,
# you can comment out the assertions of the last hurl request made in a hurl file, and then run the spec
# without the "--test" flag, like this
# hurl --very-verbose -k --variable host=studio.uesio-dev.com --variable port=3000 libs/apps/uesio/tests/hurl_specs/wire_collection_dependencies.hurl
