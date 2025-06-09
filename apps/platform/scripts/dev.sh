#!/bin/bash

set -e

has_watch=false
for arg in "$@"; do
  if [ "$arg" = "--watch" ]; then
    has_watch=true
    break
  fi
done

if $has_watch; then
  nx run platform:serve:watch
else
  nx run platform:serve
fi
