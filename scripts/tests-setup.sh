#!/usr/bin/env bash

set -e

# Ensure that ssl directory is non-empty, otherwise seed SSL
CERT_FILE="./apps/platform/ssl/certificate.crt"
if [ -f "$CERT_FILE" ]; then
    echo "SSL certificate already exists."
else
    echo "SSL certificate does not exist, creating..."
    cd apps/platform/ssl
    bash ./create.sh
    echo "SSL Certificate and private key created!"
    cd ../../../
    # Update CA certificates so that CLI and Curl will not complain when connecting
    # to our local Uesio instance with self-signed certificate
    sudo cp apps/platform/ssl/certificate.crt /usr/local/share/ca-certificates/
    sudo update-ca-certificates
fi

# Ensure that we have a Uesio docker image to run
# In CI, we should have the image built already but locally we want to re-build on every run
if [[ -z "${APP_IMAGE}" ]]; then
    # use a specific tag to avoid each built image remaining in docker
    IMAGE_TAG="uesio-test:latest"
    # force a (re)build to ensure we use current filesystem (e.g., uncommitted changes)
    # intentionally not providing BUILD_VERSION argument so that platform just uses
    # current time for version
    docker build --tag $IMAGE_TAG -f ./apps/platform/Dockerfile .
    export APP_IMAGE="$IMAGE_TAG"
fi

export APP_HOST="https://studio.uesio-dev.com:3000"

# Spin up dependencies and the app, and run migrations againt the DB
docker compose -f docker-compose-tests.yaml down --volumes
docker compose -f docker-compose-tests.yaml up -d
echo "Waiting for Uesio app to start..."
# curl the app's /health route in a loop and sleep 1 second until we get a 200
until $(curl --output /dev/null --silent --fail $APP_HOST/health); do
    printf '.'
    sleep 1
done
