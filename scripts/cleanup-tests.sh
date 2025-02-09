#!/usr/bin/env bash

# Initial setup
source ./scripts/tests/setup-common.sh

# cleans up the tests app and workspaces,
# and verifies that cleanup worked as expected
bash "scripts/tests/cleanup-common.sh"
