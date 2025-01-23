#!/usr/bin/env bash

################################################################################
# Purpose: For developers to run integration and E2E tests against their local app
# (so that you can debug the tests locally)
# Assumes that you have the Uesio app and deps running already
################################################################################

set -e

# Runs unit tests
npm run test

# Runs Hurl integration tests against the app
bash ./scripts/run-integration-tests.sh

# Runs Cypress End-to-End tests against the app
bash ./scripts/run-e2e-tests.sh

# Cleans up the tests app and workspaces
bash ./scripts/tests-cleanup.sh

