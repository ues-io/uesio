#!/usr/bin/env bash

set -e
shopt -s expand_aliases

source ./scripts/setup-env.sh

SCRIPT_DIR=$(dirname "$(realpath "$0")")
alias uesio="$SCRIPT_DIR/../../../dist/cli/uesio"

# Deploy the sample app using Uesio

echo "Logging in to Studio as uesio user..."
uesio sethost
uesio logout
uesio login

echo "Deleting tests app if it exists..."
npx hurl -k --error-format long --no-output hurl_seeds/delete_app.hurl
echo "Creating the tests app and dev workspace..."
npx hurl -k --error-format long --no-output hurl_seeds/create_app_and_workspace.hurl

# truncatetests workspace
echo "Changing to truncatetests workspace..."
uesio work -n truncatetests
echo "Deploying tests app to Studio truncatetests workspace..."
uesio deploy

echo "Upserting seed data into truncatetests workspace..."
uesio upsert -f seed_data/wire_conditions.csv -s seed_data/wire_conditions_import.spec.json

# dev workspace
echo "Configuring dev workspace..."
uesio work -n dev
echo "Deploying tests app to Studio dev workspace..."
uesio deploy
echo "Successfully deployed tests app to Studio. Upserting seed data into dev workspace..."
uesio upsert -f seed_data/animals.csv -s seed_data/animals_import.spec.json
uesio upsert -f seed_data/wire_conditions.csv -s seed_data/wire_conditions_import.spec.json
uesio upsert -f seed_data/accounts.csv -s seed_data/accounts_import.spec.json
uesio upsert -f seed_data/contacts.csv -s seed_data/contacts_import.spec.json
uesio upsert -f seed_data/tools.csv -s seed_data/tools_import.spec.json

# Populate secrets and config values for the dev workspace
npx hurl -k --error-format long --no-output hurl_seeds/populate_secrets_and_config_values.hurl

echo "Successfully upserted seed data into our workspace. Creating a test site, domain, and bundle..."

# Now that we have deployed our metadata to the workspace, we can create a bundle, site, and domain which uses its metadata
npx hurl -k --error-format long --no-output hurl_seeds/site_domain_bundle.hurl

echo "Seeding data into our test site..."
uesio siteadmin -n=testsite
uesio site upsert -f seed_data/animals.csv -s seed_data/animals_import.spec.json
uesio site upsert -f seed_data/users.csv -s seed_data/users_import.spec.json
uesio site upsert -f seed_data/loginmethods.csv -s seed_data/loginmethods_import.spec.json
uesio site upsert -f seed_data/accounts.csv -s seed_data/accounts_import.spec.json
uesio site upsert -f seed_data/contacts.csv -s seed_data/contacts_import.spec.json
uesio site upsert -f seed_data/accountteammembers.csv -s seed_data/accountteammembers_import.spec.json
uesio site upsert -f seed_data/tools.csv -s seed_data/tools_import.spec.json