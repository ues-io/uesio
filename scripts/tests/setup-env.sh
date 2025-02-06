#!/usr/bin/env bash

# Intentionaly not including set -e to avoid leaking it since this script might be called directly by users via source command

export UESIO_TEST_DOMAIN=uesio-dev.com
export UESIO_TEST_HOST_NAME=studio.$UESIO_TEST_DOMAIN
export UESIO_TEST_PORT=3000
export UESIO_TEST_PROTOCOL=https
export UESIO_TEST_APP_URL="$UESIO_TEST_PROTOCOL://$UESIO_TEST_HOST_NAME:$UESIO_TEST_PORT"
