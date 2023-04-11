#!/usr/bin/env bash

################################################################################
# Purpose: Runs all E2E and integration tests against a running Docker container
################################################################################

set -e

# Spins up dependencies and runs the app in Docker
bash ./scripts/tests-setup.sh

# Runs Hurl integration tests against the app
bash ./scripts/run-integration-tests.sh

# Runs Cypress End-to-End tests against the app
bash ./scripts/run-e2e-tests.sh

# Spins down all docker containers
bash ./scripts/tests-cleanup.sh

