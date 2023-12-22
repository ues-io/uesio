#!/usr/bin/env bash

set -e

export UESIO_CLI_LOGIN_METHOD=uesio/core.mock
export UESIO_CLI_USERNAME=uesio
export UESIO_CLI_HOST="https://studio.uesio-dev.com:3000"
# this enables {{unix_epoch_seconds}} variable to be used within tests to add some uniqueness to seed values
export HURL_unix_epoch_seconds=$(date +%s)
export HURL_num_common_fields=8
export HURL_num_public_core_collections=13
export HURL_num_tests_collections=9
# this number should be the sum of the above two variables
export HURL_num_core_and_tests_collections=$(($HURL_num_public_core_collections + $HURL_num_tests_collections))

# Initialize and the sample app and seed test data
bash "scripts/tests-init.sh"

echo "Running tests..."

cd libs/apps/uesio/tests

# Run specs
hurl --error-format long -k --variable host=studio.uesio-dev.com --variable domain=uesio-dev.com --variable port=3000 --test hurl_specs/*.hurl
# Run field condition tests
hurl --error-format long -k --variable host=studio.uesio-dev.com --variable domain=uesio-dev.com --variable port=3000 --test hurl_fields/*.hurl

# FYI if you want to view the output of the request made by a specific hurl spec,
# you can comment out the assertions of the last hurl request made in a hurl file, and then run the spec
# without the "--test" flag, like this
# hurl --very-verbose -k --variable host=studio.uesio-dev.com --variable domain=uesio-dev.com --variable port=3000 hurl_specs/wire_collection_dependencies.hurl

cd - >> /dev/null
