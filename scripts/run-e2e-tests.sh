#!/usr/bin/env bash

set -e

# Initial setup
source ./scripts/tests/setup-common.sh

# Runs Cypress End-to-End tests against the app
bash ./scripts/tests/start-e2e-tests.sh

# cleans up the tests app and workspaces,
# and verifies that cleanup worked as expected
bash ./scripts/tests/cleanup-common.sh
