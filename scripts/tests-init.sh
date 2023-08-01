#!/usr/bin/env bash

set -e

export UESIO_CLI_LOGIN_METHOD=uesio/core.mock
export UESIO_CLI_USERNAME=uesio
export UESIO_CLI_HOST="https://studio.uesio-dev.com:3000"

# Deploy the sample app using Uesio
cd libs/apps/uesio/tests

echo "Logging in to Studio as uesio user..."
uesio logout
uesio sethost
uesio login

echo "Deleting and recreating the tests app and dev workspace..."
hurl -k --no-output --variable host=studio.uesio-dev.com --variable port=3000 hurl_seeds/app_and_workspace.hurl

# dev workspace
echo "Configuring dev workspace..."
uesio work -n dev
echo "Deploying tests app to Studio dev workspace..."
uesio deploy
echo "Successfully deployed tests app to Studio. Upserting seed data into dev workspace..."
uesio upsert -f seed_data/animals.csv -s seed_data/animals_import.spec.json
uesio upsert -f seed_data/wire_conditions.csv -s seed_data/wire_conditions_import.spec.json

# truncatetests workspace
echo "Changing to truncatetests workspace..."
uesio work -n truncatetests
echo "Deploying tests app to Studio truncatetests workspace..."
uesio deploy
echo "Upserting seed data into truncatetests workspace..."
uesio upsert -f seed_data/wire_conditions.csv -s seed_data/wire_conditions_import.spec.json

echo "Successfully upserted seed data into our workspace. Creating a test site, domain, and bundle..." 

# Now that we have deployed our site, we can create a bundle, site, and domain which uses its metadata
hurl -k --no-output --variable host=studio.uesio-dev.com --variable port=3000 hurl_seeds/site_domain_bundle.hurl

echo "Seeding data into our test site..."
uesio siteadmin -n=testsite
uesio site upsert -f seed_data/animals.csv -s seed_data/animals_import.spec.json

cd - >> /dev/null