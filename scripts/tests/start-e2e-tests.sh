#!/usr/bin/env bash

set -e

export UESIO_APP_URL=$UESIO_TEST_APP_URL
export UESIO_DEV=true

# Initialize the sample app and seed test data
bash "scripts/tests/init-common.sh"

# Run e2e tests with cypress
npx cypress run --project apps/platform-e2e
