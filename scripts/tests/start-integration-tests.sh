#!/usr/bin/env bash

set -e

# this enables {{unix_epoch_seconds}} variable to be used within tests to add some uniqueness to seed values
export HURL_unix_epoch_seconds=$(date +%s)
export HURL_num_common_fields=8
export HURL_num_public_core_collections=14
export HURL_num_tests_collections=11
export HURL_num_aikit_collections=2
export HURL_num_appkit_collections=1
# this number should be the sum of the above two variables
export HURL_num_core_and_tests_collections=$(($HURL_num_public_core_collections + $HURL_num_tests_collections + $HURL_num_aikit_collections + $HURL_num_appkit_collections))

# Initialize the sample app and seed test data
bash "scripts/tests/init-common.sh"

echo "Running Integration tests..."

cd apps/platform-integration-tests

# TODO: Hurl 5.0 added parallel test execution which is enabled by default.  Currently, hurl tests fail when run in parallel.  For now, forcing
# sequential execution via --jobs flag but this should be investigated and, assuming possible depending on root cause, changed to not limit parallel execution.
# See https://github.com/ues-io/uesio/issues/4457
# Run specs
npx hurl --jobs 1 --error-format long -k --variable host=$UESIO_TEST_HOST_NAME --variable domain=$UESIO_TEST_DOMAIN --variable port=$UESIO_TEST_PORT --test hurl_specs/*.hurl
# Run field condition tests
npx hurl --jobs 1 --error-format long -k --variable host=$UESIO_TEST_HOST_NAME --variable domain=$UESIO_TEST_DOMAIN --variable port=$UESIO_TEST_PORT --test hurl_fields/*.hurl

# FYI if you want to view the output of the request made by a specific hurl spec,
# you can comment out the assertions of the last hurl request made in a hurl file, and then run the spec
# without the "--test" flag, like this
# npx hurl --very-verbose -k --variable host=$UESIO_TEST_HOST_NAME --variable domain=$UESIO_TEST_DOMAIN --variable port=$UESIO_TEST_PORT hurl_specs/wire_collection_dependencies.hurl

npx hurl --very-verbose -k --variable host=$UESIO_TEST_HOST_NAME --variable domain=$UESIO_TEST_DOMAIN --variable port=$UESIO_TEST_PORT --test hurl_specs_single_run/perf_stats.hurl

cd - >> /dev/null
