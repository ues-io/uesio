#!/usr/bin/env bash

################################################################################
# Purpose:
# 1. Runs Uesio app in isolated Docker container, with dependencies
# 2. Runs integration tests against the app
# 3. Runs End-to-End tests against the app
# 4. Spins down the Docker containers
################################################################################

set -e

# Ensure that we have a Uesio docker image to run
# In CI, we should have the image built already but locally we want to re-build on every run
if [[ -z "${APP_IMAGE}" ]]; then
    # Ensure everything is built with latest code
    echo "Building projects..."
    npm run build-all

    echo "Building docker image..."
    # use a specific tag to avoid each built image remaining in docker
    IMAGE_TAG="uesio-test:latest"
    # force a (re)build to ensure we use current filesystem (e.g., uncommitted changes)
    # intentionally not providing BUILD_VERSION argument so that platform just uses
    # current time for version
    docker build --tag $IMAGE_TAG -f ./apps/platform/Dockerfile .
    export APP_IMAGE="$IMAGE_TAG"
fi

# Spin up dependencies and the app, and run migrations againt the DB
docker compose -f docker-compose-tests.yaml down --volumes
docker compose -f docker-compose-tests.yaml up -d --wait

# parallel=1 seems to be broken in NX 21 so invoking separately until nx resolves the issue
# TODO: Monitor https://github.com/nrwl/nx/issues/31494 and update to "nx run-many -t test-integration:run test-e2e:run --parallel=1" once a fix is released
# TODO: refactor e2e and integration tests so that they don't rely on the same "test data" so that they can be run in parallel
#nx run-many -t test-integration:run 
nx run-many -t test-e2e:run

# Spin down the tests network's Docker containers
# In CI, we leave it up so that we can collect the logs
if [[ ${CI} != "true" ]]; then 
    docker compose -f docker-compose-tests.yaml down
fi
