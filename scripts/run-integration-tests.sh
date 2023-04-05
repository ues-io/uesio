#!/usr/bin/env bash

set -e

# Delete and recreate the tests app and dev workspace
hurl --no-output --variable host=studio.uesio-dev.com --variable port=3009 libs/apps/uesio/tests/hurl_seeds/*.hurl

export UESIO_CLI_LOGIN_METHOD=uesio/core.mock
export UESIO_CLI_USERNAME=uesio
export UESIO_CLI_HOST="https://studio.uesio-dev.com:3009"

# Deploy the sample app using Uesio
cd libs/apps/uesio/tests

echo "Logging in to Studio as uesio user..."
../../../../dist/clio/clio logout
../../../../dist/clio/clio sethost
../../../../dist/clio/clio login
echo "Configuring workspace..."
../../../../dist/clio/clio work
echo "Deploying tests app to Studio..."
../../../../dist/clio/clio deploy
echo "Successfully deployed tests app to Studio. Running tests..."

cd ../../../..

# Run specs
hurl --variable host=studio.uesio-dev.com --variable port=3009 --test libs/apps/uesio/tests/hurl_specs/*.hurl
