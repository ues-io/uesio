#!/usr/bin/env bash

cat node_modules/@orangeopensource/hurl/package.json | jq -r '."hurlBinaryVersion"' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'
