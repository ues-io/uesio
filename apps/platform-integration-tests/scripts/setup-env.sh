#!/usr/bin/env bash

set -e

export HURL_site_scheme=$([ "${UESIO_USE_HTTPS}" = "true" ] && echo "https" || echo "http")
export HURL_site_primary_domain=${UESIO_PRIMARY_DOMAIN:-localhost}
export HURL_site_port=${UESIO_PORT:-3000}

export UESIO_CLI_LOGIN_METHOD=uesio/core.mock
export UESIO_CLI_USERNAME=uesio
export UESIO_CLI_HOST="$HURL_site_scheme://studio.$HURL_site_primary_domain:$HURL_site_port"