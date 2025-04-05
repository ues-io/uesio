## cypress.config.mjs

### As of April 4, 2025

The changes made on March 17, 2025 work on linux including in CI, however they are causing issues on macOS when running e2e tests:

```
npx nx run platform-e2e:e2e


      > nx run platform-e2e:e2e

      > cypress run


      DevTools listening on ws://127.0.0.1:54321/devtools/browser/ad93d726-2acf-4829-ade1-ff8dd7a5a367
      Your configFile is invalid: /Users/ben/dev/uesio/apps/platform-e2e/cypress.config.mjs

      It threw an error when required, check the stack trace below:

      Error: Cannot find module 'file:///Users/ben/dev/uesio/apps/platform-e2e/cypress.config.mjs'
      Require stack:
      - /Users/ben/Library/Caches/Cypress/13.17.0/Cypress.app/Contents/Resources/app/packages/server/lib/plugins/child/run_require_async_child.js
      - /Users/ben/Library/Caches/Cypress/13.17.0/Cypress.app/Contents/Resources/app/packages/server/lib/plugins/child/require_async_child.js
          at Function.<anonymous> (node:internal/modules/cjs/loader:1244:15)
          at Function.Module._resolveFilename (/Users/ben/Library/Caches/Cypress/13.17.0/Cypress.app/Contents/Resources/app/node_modules/tsconfig-paths/lib/register.js:85:40)
          at Function.Module._resolveFilename.sharedData.moduleResolveFilenameHook.installedValue [as _resolveFilename] (/Users/ben/Library/Caches/Cypress/13.17.0/Cypress.app/Contents/Resources/app/node_modules/@cspotcode/source-map-support/source-map-support.js:811:30)
          at Function._load (node:internal/modules/cjs/loader:1070:27)
          at TracingChannel.traceSync (node:diagnostics_channel:322:14)
          at wrapModuleLoad (node:internal/modules/cjs/loader:217:24)
          at Module.require (node:internal/modules/cjs/loader:1335:12)
          at require (node:internal/modules/helpers:136:16)
          at /Users/ben/Library/Caches/Cypress/13.17.0/Cypress.app/Contents/Resources/app/packages/server/lib/plugins/child/run_require_async_child.js:106:34
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at async loadFile (/Users/ben/Library/Caches/Cypress/13.17.0/Cypress.app/Contents/Resources/app/packages/server/lib/plugins/child/run_require_async_child.js:106:14)
          at async EventEmitter.<anonymous> (/Users/ben/Library/Caches/Cypress/13.17.0/Cypress.app/Contents/Resources/app/packages/server/lib/plugins/child/run_require_async_child.js:116:32)
      Warning: command "cypress run" exited with non-zero status code
```

When `package.json` exists in `platform-e2e` folder with `"type": "module"`, `npx nx graph` no longer seems to fail so changing approach to go back to `ts` file and adding `package.json` to folder with `"type": "module"`. This is still a workaround for what appears to be an issue with cypress and/or nx/cypress integration where it respects root level package.json `"type": "module"` to get things started but then NX cypress plugin only looks in the folder itself and ends up loading commonjs. Nothing wrong with having the package.json in the folder with `"type": "module"`, just should be unnecessary.

TODO: Continue to monitor and could potentially eliminate the package.json if Nx ever fixes the underlying issue.

### As of March 17, 2025

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
