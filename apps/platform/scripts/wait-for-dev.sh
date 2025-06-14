#!/bin/bash

set -e

site_scheme=$([ "${UESIO_USE_HTTPS}" = "true" ] && echo "https" || echo "http")
site_primary_domain=${UESIO_PRIMARY_DOMAIN:-uesio.localhost}
site_port=${UESIO_PORT:-3000}
site_url="$site_scheme://studio.$site_primary_domain:$site_port"
site_health_url="$site_url/health"

timeout=5
interval=0.2
elapsed=0

# Wait for server to become healthy
while (( $(echo "$elapsed < $timeout" | bc -l) )); do
    status=$(curl -k -s -o /dev/null -w "%{http_code}" "$site_health_url" || true)
    if [ "$status" -eq 200 ]; then
        echo "Healthy (HTTP 200)"
        exit 0
    fi
    sleep $interval
    elapsed=$(echo "$elapsed + $interval" | bc)
done

echo "Timeout: $URL did not return HTTP 200 within $timeout seconds"
exit 1
