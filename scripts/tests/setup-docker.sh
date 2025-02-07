#!/usr/bin/env bash

set -e

# Ensure everything is built with latest code
# UESIO_DEV set to ensure packui is built
UESIO_DEV=true npm run build-all

# Ensure that we have a Uesio docker image to run
# In CI, we should have the image built already but locally we want to re-build on every run
if [[ -z "${APP_IMAGE}" ]]; then
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
docker compose -f docker-compose-tests.yaml up -d
echo "Waiting for Uesio app to start..."
# curl the app's /health route in a loop and sleep 1 second until we get a 200
until $(curl --output /dev/null --silent --fail $UESIO_TEST_APP_URL/health); do
    printf '.'
    sleep 1
done
