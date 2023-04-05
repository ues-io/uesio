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
fi

# Ensure that we have a Uesio docker image to run
# In CI, we should have the image built already, but locally we may not
if [[ -z "${GITSHA}" ]]; then
    export GITSHA=$(git rev-parse --short HEAD)
    if [[ "$(docker images -q $GITSHA 2> /dev/null)" == "" ]]; then
        docker build --tag "$GITSHA" -f ./apps/platform/Dockerfile .
        export APP_IMAGE="$GITSHA"
    fi
fi
if [[ -z "${APP_IMAGE}" ]]; then
    export APP_IMAGE="$GITSHA"
fi

# Spin up dependencies and the app, and run migrations againt the DB
docker compose -f docker-compose-tests.yaml down --volumes
docker compose -f docker-compose-tests.yaml up -d
# TODO: Wait for app to start to be available rather than sleeping...
echo "Waiting for Uesio app to start..."
sleep 5;