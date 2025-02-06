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

# Ensure everything is built with latest code
echo "UESIO_DEV=$UESIO_DEV"
npm run build-all

# Initial setup
source ./scripts/tests/setup-common.sh

# Spins up dependencies and runs the app in Docker
bash ./scripts/tests/setup-docker.sh

# Runs Hurl integration tests against the app
bash ./scripts/tests/start-integration-tests.sh

# Runs Cypress End-to-End tests against the app
bash ./scripts/tests/start-e2e-tests.sh

# cleans up the tests app and workspaces,
# and verifies that cleanup worked as expected
bash ./scripts/tests/cleanup-common.sh

# Spins down all docker containers
bash ./scripts/tests/cleanup-docker.sh

