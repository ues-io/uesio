#!/usr/bin/env bash

set -e

if [[ -z "${APP_IMAGE}" ]]; then
    export APP_IMAGE="uesio-test:latest"
fi

# Spin down the tests network's Docker containers
docker compose -f docker-compose-tests.yaml down
