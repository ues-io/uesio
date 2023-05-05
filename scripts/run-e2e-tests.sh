#!/usr/bin/env bash

set -e

# Run e2e tests with cypress
export UESIO_APP_URL="https://studio.uesio-dev.com:3000"
export UESIO_DEV=true
./node_modules/.bin/cypress run
