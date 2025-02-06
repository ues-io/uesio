#!/usr/bin/env bash

set -e
shopt -s expand_aliases

export UESIO_CLI_LOGIN_METHOD=uesio/core.mock
export UESIO_CLI_USERNAME=uesio
export UESIO_CLI_HOST=$UESIO_TEST_APP_URL

SCRIPT_DIR=$(dirname "$(realpath "$0")")
alias uesio="$SCRIPT_DIR/../../dist/cli/uesio"

#Navigate
cd apps/platform-integration-tests

echo "Logging in to Studio as uesio user..."
uesio logout
uesio sethost
uesio login

# Truncate dev workspace
echo "Truncate dev workspace."
uesio work -n dev
# TODO: This may fail because the workspace does not exist which is ultimately what we are after in this script.  There
# is no built-in method to determine if a workspace exists currently (see https://github.com/ues-io/uesio/issues/4573)
# and we can't assume a failure is because it does not exist (it may not be running or could be for another reason).
# This needs to be improved to check if the workspace exists first and if it doesn't, then just return else continue.
uesio workspace truncate
echo "dev workspace should be clear"

#Navigate back
cd - >> /dev/null

# Run specs
npx hurl -k --variable host=$UESIO_TEST_HOST_NAME --variable port=$UESIO_TEST_PORT --test apps/platform-integration-tests/hurl_specs_single_run/truncate_tenant_data_cli.hurl

# Delete the workspaces
cd apps/platform-integration-tests
uesio workspace delete -n truncatetests
uesio workspace delete -n dev
uesio workspace delete -n quickstart
cd - >> /dev/null

# Remove anything that remains
echo "Deleting tests app..."
npx hurl -k --error-format long --no-output --variable host=$UESIO_TEST_HOST_NAME --variable port=$UESIO_TEST_PORT --variable domain=$UESIO_TEST_DOMAIN apps/platform-integration-tests/hurl_seeds/delete_app.hurl
