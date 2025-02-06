#!/usr/bin/env bash

################################################################################
# Purpose: For developers to run unit, integration and E2E tests against their local app
# (so that you can debug the tests locally)
# Assumes that you have the Uesio app and deps running already
################################################################################

set -e

# Initial setup
source ./scripts/tests/setup-common.sh

# Runs unit tests
npm run test

# Runs Hurl integration tests against the app
bash ./scripts/tests/start-integration-tests.sh

# Runs Cypress End-to-End tests against the app
bash ./scripts/tests/start-e2e-tests.sh

# cleans up the tests app and workspaces,
# and verifies that cleanup worked as expected
bash ./scripts/tests/cleanup-common.sh

