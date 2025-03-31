#!/usr/bin/env bash

set -e

# legacy behavior default to https if not set or empty
# TODO: should default to http (localhost refactor)
export HURL_site_scheme=$([ "${UESIO_USE_HTTPS:-true}" = "true" ] && echo "https" || echo "http")
# legacy behavior default to uesio-dev.com if not set or empty
# TODO: should default to localhost (localhost refactor)
export HURL_site_primary_domain=${UESIO_PRIMARY_DOMAIN:-uesio-dev.com}
# legacy behavior default to 3000 if not set or empty
export HURL_site_port=${UESIO_PORT:-3000}

export UESIO_CLI_LOGIN_METHOD=uesio/core.mock
export UESIO_CLI_USERNAME=uesio
export UESIO_CLI_HOST="$HURL_site_scheme://studio.$HURL_site_primary_domain:$HURL_site_port"