#!/usr/bin/env bash

set -e

export HURL_site_scheme=$UESIO_TEST_SCHEME
export HURL_site_primary_domain=$UESIO_TEST_DOMAIN
export HURL_site_port=$UESIO_TEST_PORT

# Initialize the sample app and seed test data
bash "scripts/tests/init-common.sh"

echo "Running Integration tests..."

cd apps/platform-integration-tests

# TODO: Hurl 5.0 added parallel test execution which is enabled by default.  Currently, hurl tests fail when run in parallel.  For now, forcing
# sequential execution via --jobs flag but this should be investigated and, assuming possible depending on root cause, changed to not limit parallel execution.
# See https://github.com/ues-io/uesio/issues/4457
# Run specs
npx hurl --jobs 1 --error-format long -k --test hurl_specs/*.hurl
# Run field condition tests
npx hurl --jobs 1 --error-format long -k --test hurl_fields/*.hurl

# FYI if you want to view the output of the request made by a specific hurl spec,
# you can comment out the assertions of the last hurl request made in a hurl file, and then run the spec
# without the "--test" flag, like this
# npx hurl --very-verbose -k --variable site_scheme=https --variable site_primary_domain=uesio-dev.com --variable site_port=3000 hurl_specs/wire_collection_dependencies.hurl

npx hurl --very-verbose -k --test hurl_specs_single_run/perf_stats.hurl

cd - >> /dev/null
