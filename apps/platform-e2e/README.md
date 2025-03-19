## cypress.config.mjs

Using mjs format for cypress config file instead of ts file for a couple of reasons:

1. cypress 13.7 attempts to detect ESM via package.json but only looks in the actual projectroot and doesn't traverse up to find a package.json. Given the lack of traversal, even though root package.json is type=module, cypress doesn't find it so treats as commonjs project. Adding a package.json inside of platform-e2e with type=module solves this issue but creates a different issue with nx when building the graph. Note that even without a package.json, cypress properly detects that typescript is being used because it does a require.resolve("typescript") which finds typescript because its in node_modules (via root package.json).
   1. Typescript Resolve: https://github.com/cypress-io/cypress/blob/develop/packages/data-context/src/util/hasTypescript.ts#L9
   2. ESM Resolve: https://github.com/cypress-io/cypress/blob/f5815b776f71ff9d5de9465fa00384030ce78425/packages/data-context/src/data/ProjectConfigIpc.ts#L279
   3. Determine loader based on above: https://github.com/cypress-io/cypress/blob/f5815b776f71ff9d5de9465fa00384030ce78425/packages/data-context/src/data/ProjectConfigIpc.ts#L296
   4. See Related: // https://github.com/cypress-io/cypress/issues/23552
2. When package.json exists in platform-e2e with type=module, running nx graph fails because its trying to load cypress.config.ts as CJS. Unclear exactly why but its a problem with the nx cypress plugin and not detecting the proper format.

```bash
$> npx nx graph

 NX   An error occurred while processing files for the @nx/cypress/plugin plugin (Defined at nx.json#plugins[1])
.
  - apps/platform-e2e/cypress.config.ts: exports is not defined

 - apps/platform-e2e/cypress.config.ts: ReferenceError: exports is not defined
    at file:///home/barry/repos/uesio-cypress-refactor/apps/platform-e2e/cypress.config.ts:2:23
    at ModuleJobSync.runSync (node:internal/modules/esm/module_job:395:35)
    at ModuleLoader.importSyncForRequire (node:internal/modules/esm/loader:360:47)
    at loadESMFromCJS (node:internal/modules/cjs/loader:1385:24)
    at Module._compile (node:internal/modules/cjs/loader:1536:5)
    at Module._compile (/home/barry/repos/uesio-cypress-refactor/node_modules/pirates/lib/index.js:117:24)
    at node:internal/modules/cjs/loader:1706:10
    at Object.newLoader (/home/barry/repos/uesio-cypress-refactor/node_modules/pirates/lib/index.js:121:7)
    at Module.load (node:internal/modules/cjs/loader:1289:32)
    at Function._load (node:internal/modules/cjs/loader:1108:12)


 NX   An error occured while processing the project graph. Showing partial graph.
```

To avoid both issues, using mjs instead of ts extension (cypress does not support mts extension for config).

TODO: Track nx and cypress for improvements on both of these and change back to ts extension if/when issues are resolved. We haven't updated to cypress 14 yet due to [nx limitations](../../README.md#npm-dependencies) but in reviewing cypress code, that upgrade alone is unlikely to resolve the issues.
