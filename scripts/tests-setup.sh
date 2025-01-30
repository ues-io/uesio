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
# In CI, we should have the image built already, but locally we may not
if [[ -z "${GITSHA}" ]]; then
    export GITSHA=$(git rev-parse --short HEAD)
    # force a (re)build to ensure we use current filesystem (e.g., uncommitted changes)
    docker build --tag "$GITSHA" -f ./apps/platform/Dockerfile .
    export APP_IMAGE="$GITSHA"
fi
if [[ -z "${APP_IMAGE}" ]]; then
    export APP_IMAGE="$GITSHA"
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
