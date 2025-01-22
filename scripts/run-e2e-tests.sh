#!/usr/bin/env bash

set -e

# Run e2e tests with cypress
export UESIO_APP_URL="https://studio.uesio-dev.com:3000"
export UESIO_DEV=true
npx cypress run --project apps/platform-e2e
