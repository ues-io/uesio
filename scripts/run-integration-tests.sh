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
echo "Successfully deployed tests app to Studio. Running tests..."

cd ../../../..

# Run specs
hurl -k --variable host=studio.uesio-dev.com --variable port=3000 --test libs/apps/uesio/tests/hurl_specs/*.hurl
