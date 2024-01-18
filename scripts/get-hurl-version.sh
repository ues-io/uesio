#!/usr/bin/env bash

cat package.json | jq -r '."devDependencies"."@orangeopensource/hurl"' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'