#!/usr/bin/env bash

set -e

# Delete and recreate the tests app and dev workspace
hurl --test libs/apps/uesio/tests/hurl_seeds/*.hurl

# Run specs