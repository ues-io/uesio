#!/usr/bin/env bash

################################################################################
# Purpose: Runs all E2E and integration tests against a running Docker container
################################################################################

set -e

bash ./scripts/tests-setup.sh

bash ./scripts/run-integration-tests.sh

bash ./scripts/run-e2e-tests.sh

bash ./scripts/tests-cleanup.sh

