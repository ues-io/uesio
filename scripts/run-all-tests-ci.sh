#!/usr/bin/env bash

################################################################################
# Purpose:
# 1. Runs Uesio app in isolated Docker container, with dependencies
# 2. Runs integration tests against the app
# 3. Runs End-to-End tests against the app
# 4. Cleans up test app and workspaces
# 5. Spins down the Docker containers
################################################################################

set -e

# Spins up dependencies and runs the app in Docker
bash ./scripts/tests-setup.sh

# Runs unit tests
npm run test

# Runs Hurl integration tests against the app
bash ./scripts/run-integration-tests.sh

# Runs Cypress End-to-End tests against the app
bash ./scripts/run-e2e-tests.sh

# cleans up the tests app and workspaces,
# and verifies that these routines work as expected
bash ./scripts/tests-cleanup.sh

# Spins down all docker containers
bash ./scripts/tests-down.sh

