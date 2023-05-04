#!/bin/bash

set -e

uesio packui
mkdir -p ../../dist/ui/types
cp -R src/public_types/** ../../dist/ui/types
echo -e "declare module \"@uesio/bots\" {\n$(cat src/public_types/server/index.d.ts)\n}" > ../../dist/ui/types/server/bots.d.ts
npx tsc --noEmit --project ./tsconfig.lib.json