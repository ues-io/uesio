#!/usr/bin/env bash

set -e
shopt -s expand_aliases

export UESIO_CLI_LOGIN_METHOD=uesio/core.mock
export UESIO_CLI_USERNAME=uesio
export UESIO_CLI_HOST="https://studio.uesio-dev.com:3000"

SCRIPT_DIR=$(dirname "$(realpath "$0")")
alias uesio="$SCRIPT_DIR/../dist/cli/uesio"

#Navigate
cd apps/platform-integration-tests

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
npx hurl -k --variable host=studio.uesio-dev.com --variable port=3000 --test apps/platform-integration-tests/hurl_specs_single_run/truncate_tenant_data_cli.hurl

# Delete the workspaces
cd apps/platform-integration-tests
uesio workspace delete -n truncatetests
uesio workspace delete -n dev
cd - >> /dev/null
