#!/usr/bin/env bash

set -e

# Common environment variables
export UESIO_TEST_DOMAIN=uesio-dev.com
export UESIO_TEST_HOST_NAME=studio.$UESIO_TEST_DOMAIN
export UESIO_TEST_PORT=3000
export UESIO_TEST_PROTOCOL=https
export UESIO_TEST_APP_URL="$UESIO_TEST_PROTOCOL://$UESIO_TEST_HOST_NAME:$UESIO_TEST_PORT"
