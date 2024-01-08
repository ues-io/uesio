#!/usr/bin/env bash

set -e

if [[ -z "${APP_IMAGE}" ]]; then
    if [[ -z "${GITSHA}" ]]; then
        export GITSHA=$(git rev-parse --short HEAD)
    fi
    export APP_IMAGE="$GITSHA"
fi

# Spin down the tests network's Docker containers
docker compose -f docker-compose-tests.yaml down