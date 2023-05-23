#!/usr/bin/env bash

set -e

if [[ -z "${APP_IMAGE}" ]]; then
    if [[ -z "${GITSHA}" ]]; then
        export GITSHA=$(git rev-parse --short HEAD)
    fi
    export APP_IMAGE="$GITSHA"
fi

# Truncate dev workspace 
uesio work -n dev
echo "Truncate dev workspace."
uesio workspace truncate

# Run specs
hurl --very-verbose -k --variable host=studio.uesio-dev.com --variable port=3000 --test libs/apps/uesio/tests/hurl_specs/truncate_tenant_data_cli.hurl


# Kill all Docker containers
docker compose -f docker-compose-tests.yaml down