#!/bin/bash

set -e

../../dist/cli/uesio packui
mkdir -p ../../dist/ui/types/client
mkdir -p ../../dist/ui/types/server
# For editing TypeScript bots in Studio output a file which JUST contains Bot types
echo -e "declare module \"@uesio/bots\" {\n$(cat src/public_types/server/index.d.ts)\n}" > ../../dist/ui/types/server/bots.d.ts
# For client-side usage, output a file which contains ALL Uesio-provided types
# @uesio/bots API
echo -e "declare module \"@uesio/bots\" {\n$(cat src/public_types/server/index.d.ts)\n}" > ../../dist/ui/types/client/index.d.ts
# @uesio/ui API
echo -e "declare module \"@uesio/ui\" {\n$(cat src/public_types/client/index.d.ts)\n}" >> ../../dist/ui/types/client/index.d.ts

npx tsc --noEmit --project ./tsconfig.lib.json

# Generate JSON Schema for TS types that we want to validate server-side
npx ts-json-schema-generator -j extended \
    --path "src/definition/definition.ts" \
    --tsconfig "./tsconfig.lib.json" \
    --type 'ViewDefinition' \
    --no-type-check \
    -o ../../dist/ui/types/metadata/view/viewDefinition.schema.json
npx ts-json-schema-generator -j extended \
    --path "src/definition/definition.ts" \
    --tsconfig "./tsconfig.lib.json" \
    --type 'ViewMetadata' \
    --no-type-check \
    -o ../../dist/ui/types/metadata/view/view.schema.json
