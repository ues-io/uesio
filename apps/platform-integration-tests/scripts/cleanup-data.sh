#!/usr/bin/env bash

set -e
shopt -s expand_aliases

source ./scripts/setup-env.sh

SCRIPT_DIR=$(dirname "$(realpath "$0")")
alias uesio="$SCRIPT_DIR/../../../dist/cli/uesio"

echo "Logging in to Studio as uesio user..."
uesio sethost
uesio logout
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

# Run specs
npx hurl -k --error-format long --no-output hurl_specs_single_run/truncate_tenant_data_cli.hurl

# Delete the workspaces
uesio workspace delete -n truncatetests
uesio workspace delete -n dev
uesio workspace delete -n quickstart

# Remove anything that remains
echo "Deleting tests app..."
npx hurl -k --error-format long --no-output hurl_seeds/delete_app.hurl
