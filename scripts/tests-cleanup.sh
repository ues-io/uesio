#!/usr/bin/env bash

set -e

export UESIO_CLI_LOGIN_METHOD=uesio/core.mock
export UESIO_CLI_USERNAME=uesio
export UESIO_CLI_HOST="https://studio.uesio-dev.com:3000"

if [[ -z "${APP_IMAGE}" ]]; then
    if [[ -z "${GITSHA}" ]]; then
        export GITSHA=$(git rev-parse --short HEAD)
    fi
    export APP_IMAGE="$GITSHA"
fi

#Navigate
cd libs/apps/uesio/tests

echo "Logging in to Studio as uesio user..."
uesio logout
uesio sethost
uesio login

# Truncate dev workspace 
echo "Truncate dev workspace."
uesio work -n dev
uesio workspace truncate
echo "dev workspace should be clear"

#Navigate back
cd - >> /dev/null

# Run specs
hurl -k --variable host=studio.uesio-dev.com --variable port=3000 --test libs/apps/uesio/tests/hurl_specs_single_run/truncate_tenant_data_cli.hurl

# Delete the workspaces
cd libs/apps/uesio/tests
uesio workspace delete -n truncatetests
uesio workspace delete -n dev
cd - >> /dev/null

# Kill all Docker containers
docker compose -f docker-compose-tests.yaml down