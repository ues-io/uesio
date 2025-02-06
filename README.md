# About Uesio

![Uesio Logo](./libs/apps/uesio/core/bundle/files/favicon/uesiofav.svg)

Uesio is a **low-code** application development platform.

# Set up dev environment

## Required

- Install [homebrew](https://brew.sh/) (for macOS user)
- Install git
- Install GitHub Desktop [GitHub Desktop](https://desktop.github.com/)
- Install [nvm](https://github.com/nvm-sh/nvm) (for ensuring that your version of Node.js matches the version used in the repo): `nvm install`
- Install [Go](https://golang.org/dl/)
- Install the following brew packages:
  - `hurl` (for integration tests): `brew install hurl`
  - `jq` (for JSON manipulation in Shell): `brew install jq`
  - `wget` (for fetching URLs): `brew install wget`
- Start dependencies [here](#dependencies).
- [Build](#build)
- [Run](#run).

## Optional

- Set up SSL [here](#set-up-ssl). If you don't set up SSL locally and you still want to run multiple sites locally in addition to the ues.io studio, you will need to set the `UESIO_ALLOW_INSECURE_COOKIES` environment variable to `true`
- Set up local DNS [here](#set-up-local-dns) This is also necessary if you want to run multiple sites locally in addition to the ues.io studio. By default, you can access the studio at `http://localhost:3000`
- Install [VS Code](https://code.visualstudio.com/Download) and plugins (ESLint, Prettier, Go, GitLens). Do enable `format on save` in conjunction with the `Prettier`. Set up the `code` [environment variable](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line).
- Install the following [Google Chrome plugins](https://chrome.google.com/webstore) : `React Developers Tools`, `Redux DevTools`.
- Install [Oh My Zsh](https://ohmyz.sh/)
- [Add a SSH key to your github account](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- Install the `nx` cli globally: `npm i -g nx`
- An alternative to installing `nx` globally is to set an alias in your `~/.zshrc` file or equivalent: `alias nx="npx nx"`. This way your global nx version will always be the correct version.

```
    npm run dev
```

- _Optional_. Create a file called `launch.json` located in `apps/.vscode` for the uesio server debugger in Go and paste the following :

```
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
    "name": "Launch",
    "type": "go",
    "request": "launch",
    "mode": "debug",
    "program": "${workspaceRoot}",
    "env": {},
    "args": ["serve"]
    }
  ]
}
```

# Build

- Download and install the npm module dependencies

```
npm install
```

## Build all applications and libs

```
npm run build-all
```

## Build a dedicated app (no watcher and no source map)

```
cd ./libs/apps/uesio/studio && uesio pack

// or
npm run nx -- build apps-uesio-studio

// or, if you have nx installed globally (or aliased)
nx build apps-uesio-studio
```

## Watch mode (for development)

While developing you may want the entire monorepo to rebuild changed files. You can do this with:

```
npm run watch-all
```

## (Optional) Using Uesio CLI globally

If you'd like to use the Uesio CLI that you have built elsewhere on your machine without having to explicitly reference the binary in `dist/cli`:

- Mac OS/Linux: create a symlink for the Uesio CLI into your bin (NOT an alias, which won't work with `nx`): `sudo ln -s <absolute project root path>/dist/cli/uesio /usr/local/bin`
- Windows: add `<absolute project root path>/dist/cli` to your PATH

# <a id="dependencies"></a>Start dependencies

1. Launch all local dependencies (e.g. Postgres) with Docker Compose:

```
docker compose up -d
```

2. Seed your local Postgres database with everything Uesio needs for local development

```
npm run migrations
npm run seeds
```

# <a id="run"></a>Run the web application locally

```
npm start
open http://localhost:3000
```

If you have [SSL](#set-up-ssl) and [local DNS](#set-up-your-local-dns) configured, you can access the Studio via the following "local" DNS:

```
open https://studio.uesio-dev.com:3000
```

To run the app in Docker locally:

```
npm run in-docker
open https://studio.uesio-dev.com:3000
```

# <a id="set-up-ssl"></a> Set up SSL

SSL is optional for local development. It is enabled using by setting the environment variable `UESIO_USE_HTTPS=true`

```
npm run setup-ssl
```

This script should create the `certificate.crt` and `private.key` files in the `apps/platform/ssl` directory.

On Windows/Linux, you will need to manually trust this self-signed certificate. On Mac OS, this is done automatically.

- Windows: double-click certificate.crt in the File Explorer. Click "Install Certificate..." Then place the certificate in the "Trusted Root Certification Authorities".

# <a id="set-up-local-dns"></a> Set up your local DNS

If you just want to work in the Uesio Studio site, local DNS setup is not necessary, you can just access "http://localhost:3000".

However, to simmulate how Uesio routes DNS domains and subdomains to Uesio sites, you need to configure your OS to properly route "local" DNS domains (e.g. "uesio-dev.com") to the Uesio app server running on localhost.

There are two ways to do this, you'll need to pick one:

1. Modify /etc/hosts directly

   On Mac/Linux, modify the `/etc/hosts` file to resolve local subdomains to 127.0.0.1

   `bash ./scripts/seed-etc-hosts.sh`

2. Use DNSMasq

   ```
   brew install dnsmasq
   ```

   The installation process will output several commands that you can use to start Dnsmasq automatically with a default configuration. I used the following commands but you should use whichever commands brew tells you to:

   ```
   sudo brew services start dnsmasq
   ```

## Worker jobs

There are a number of worker jobs which Uesio runs in production, to handle things such as usage event aggregation, daily invoice generation, and potentially other future use cases (such as scheduled bots).

To run the worker process, use `npm run nx -- worker platform` (Or `nx worker platform` if you have nx installed globally):

```
> nx run platform:worker

{"message":"Running Uesio worker process","severity":"INFO"}
{"message":"Scheduling job Invoices with schedule: @daily","severity":"INFO"}
{"message":"Scheduling job Usage with schedule: * * * * *","severity":"INFO"}
{"message":"Finished loading all jobs, starting scheduler now...","severity":"INFO"}
{"message":"Cron job Invoices (1) next run will be at: Mar 22 00:00:00","severity":"INFO"}
{"message":"Cron job Usage (2) next run will be at: Mar 21 20:09:00","severity":"INFO"}

```

# <a id="environment-variables"></a> (Optional) Environment Variables

The following environment variables can optionally be configured in your Shell (e.g. in `~/.zshenv` if you are using Zsh)

<table>
  <tr>
    <td>Environment Variable</td>
    <td>Description</td>
    <td>Default</td>
    <td>Examples, Values, and Help</td>
  </tr>
  <tr>
  <tr>
    <td>UESIO_USE_HTTPS</td>
    <td>Whether or not to serve with TLS</td>
    <td>false</td>
    <td>true / false</td>
  </tr>
  <tr>
    <td>HOST</td>
    <td>Host to use for HTTP server</td>
    <td>""</td>
    <td>Set to "localhost" for local development</td>
  </tr>
  <tr>
    <td>UESIO_PRIMARY_DOMAIN</td>
    <td>The primary domain to use for site identification purposes (e.g. for ues.io cloud, this is "ues.io")</td>
    <td>localhost (or "uesio-dev.com" if `UESIO_DEV=true`)</td>
    <td>If running ues.io on your own infrastructure, set to a 2-part TLD that you own.</td>
  </tr>
  <tr>
    <td>UESIO_SESSION_STORE</td>
    <td>Allows you to specify the storage location for user sessions</td>
    <td>redis</td>
    <td>redis, filesystem, ""</td>
  </tr>
  <tr>
    <td>UESIO_USERFILES_BUCKET_NAME</td>
    <td>The Bucket in AWS / local folder where user-uploaded files will be stored.</td>
    <td>""</td>
    <td></td>
  </tr>
  <tr>
    <td>UESIO_BUNDLES_BUCKET_NAME</td>
    <td>The Bucket in AWS / local folder where bundles will be stored.</td>
    <td>""</td>
    <td></td>
  </tr>
  <tr>
    <td>UESIO_STATIC_ASSETS_HOST</td>
    <td>Host from which to serve static files, including vendored JS (React) and Uesio assets</td>
    <td>""</td>
    <td>By default, assets are served from the local filesystem / Docker container. Alternately, set this to a valid URL where Uesio static assets live, e.g. "https://www.ues.io"</td>
  </tr>
  <tr>
    <td>UESIO_ALLOW_INSECURE_COOKIES</td>
    <td>Allows cookies without the secure flag</td>
    <td>true</td>
    <td>Useful in local docker development</td>
  </tr>
  <tr>
    <td>UESIO_PLATFORM_FILESOURCE_TYPE</td>
    <td>Controls where user-uploaded files are stored</td>
    <td>uesio.local</td>
    <td>Either "uesio.local" (filesystem) or "uesio.s3" (store in AWS S3)</td>
  </tr>
  <tr>
    <td>UESIO_PLATFORM_FILESOURCE_CREDENTIALS</td>
    <td>The name of the Uesio credential to use for saving user-uploaded files</td>
    <td>uesio/core.aws</td>
    <td>Must be a fully-qualified Uesio credential name</td>
  </tr>
  <tr>
    <td>UESIO_PLATFORM_BUNDLESTORE_TYPE</td>
    <td>Controls where Uesio bundles are stored</td>
    <td>uesio.local</td>
    <td>Either "uesio.local" (filesystem) or "uesio.s3" (store in AWS S3)</td>
  </tr>
  <tr>
    <td>UESIO_PLATFORM_BUNDLESTORE_CREDENTIALS</td>
    <td>The name of the Uesio credential to use for saving bundlestore files</td>
    <td>uesio/core.aws</td>
    <td>Must be a fully-qualified Uesio credential name</td>
  </tr>
  <tr>
    <td>UESIO_DEV</td>
    <td>Enable various features for use in local development of Uesio</td>
    <td>false</td>
    <td>Set to "localhost" for local development</td>
  </tr>
  <tr>
    <td>UESIO_DEBUG_SQL</td>
    <td>Enable detailed SQL query debugging</td>
    <td>false</td>
    <td>If enabled, all Wire loads will return a `debugQueryString` property containing the SQL queries made</td>
  </tr>
  <tr>
    <td>UESIO_MOCK_AUTH</td>
    <td>Enables you to login with mock user accounts (which can be specified with `UESIO_MOCK_AUTH_USERNAMES`)</td>
    <td>false</td>
    <td>Only for local dev / unit tests</td>
  </tr>
  <tr>
    <td>UESIO_MOCK_AUTH_USERNAMES</td>
    <td>A comma-separated list of usernames to use for mock authentication (requires `UESIO_MOCK_AUTH=true`)</td>
    <td>ben,abel,wessel,baxter,zach,uesio</td>
    <td>Only for local dev / unit tests</td>
  </tr>
  <tr>
    <td>UESIO_GRACEFUL_SHUTDOWN_SECONDS</td>
    <td>The number of seconds to wait before terminating the Uesio app / worker process</td>
    <td>5</td>
    <td>Should be less than whatever the ECS / Kubernetes / etc shutdown window is (usually 30)</td>
  </tr>
  <tr>
    <td>UESIO_USAGE_JOB_RECURRENCE_MINUTES</td>
    <td>The number of minutes to wait between runs of the Usage worker job</td>
    <td>10</td>
    <td>Usage data (stored in Redis) will only be aggregated and committed to Postgres as often as this job is run by the worker process. Set to a lower window for more frequent checks.</td>
  </tr>
  <tr>
    <td>UESIO_WORKER_MODE</td>
    <td>Determines whether the batch job worker will run as part of the serve command or as a separate process.</td>
    <td>separate</td>
    <td>separate: The worker will run as a separate process. combined: The worker will run as part of the serve command.</td>
  </tr>
  <tr>
    <td>UESIO_USAGE_MODE</td>
    <td>Determines whether to handle usage in memory on the web server, or to use redis for multiple web servers.</td>
    <td>redis</td>
    <td>redis, memory</td>
  </tr>
  <tr>
    <td>UESIO_PLATFORM_CACHE</td>
    <td>Determines whether to handle the platform cache in memory on the web server, or to use redis for multiple web servers.</td>
    <td>redis</td>
    <td>redis, memory</td>
  </tr>
  <tr>
    <td>REDIS_HOST</td>
    <td>The host to connect to Redis</td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td>REDIS_PORT</td>
    <td>The port to connect to Redis</td>
    <td>6739</td>
    <td></td>
  </tr>
  <tr>
    <td>REDIS_USER</td>
    <td>The Redis Username (If Necessary)</td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td>REDIS_PASSWORD</td>
    <td>The Redis Password (If Necessary)</td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td>REDIS_TTL</td>
    <td>Redis TTL Seconds</td>
    <td>86400</td>
    <td>Default is one day.</td>
  </tr>
  <tr>
    <td>REDIS_TLS</td>
    <td>Whether or not to use TLS Mode</td>
    <td>false</td>
    <td>true or false</td>
  </tr>
  <tr>
    <td>UESIO_DB_USER</td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td>UESIO_DB_PASSWORD</td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td>UESIO_DB_DATABASE</td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td>UESIO_DB_HOST</td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td>UESIO_DB_PORT</td>
    <td></td>
    <td>5432</td>
    <td></td>
  </tr>
  <tr>
    <td>UESIO_DB_SSLMODE</td>
    <td></td>
    <td>disable</td>
    <td>disable, allow, prefer, require, etc.</td>
  </tr>
</table>

In addition, all Uesio Secrets can have their default value set by setting a corresponding `UESIO_SECRET_<namespace>_<name>` environment variable. Any value set for these secrets in a Site/Workspace will override the environment variable default, but it can often be useful, especially for local development, to configure a default value, so that you don't have to populate these secrets in every site. (Note: there is no corresponding feature for Config Values, because you can define a Config Value's default directly in the metadata definition).

For example, the `uesio/appkit.resend_key` secret's default value can be configured with `export UESIO_SECRET_UESIO_APPKIT_RESEND_KEY=your-resend-key`

# npm dependencies

As mentioned in the [monorepo](#monorepo-structure) section, a single `package.json` file describes the npm dependencies for the whole monorepo.

All npm modules we used are installed as `development` dependency since uesio is not intended to be released as standalone npm module.

### Migrations

We use `golang-migrate` package for running SQL migrations. This package maintains the current state of migration runs via a `schema_migrations` table.

Migrations can be run against your local using `npm run migrations`, or you can use `./uesio migrate [up|down] [NUMBER]` to manually run a specific number of migrations, e.g. to undo the most recent migration, you can run `./uesio migrate down 1`.

To run migrations in ECS, create a new one-off Task, using the latest Task Definition for "uesio", and modify the command to be `./uesio,migrate` (or `./uesio,migrate,down,1`) to undo one migration)

#### adding migrations

New migrations can be created using `npm run migrate:create -- <SOME_NAME>`

#### manually setting the migration "pointer"

To forcibly set the migration version to latest (currently 4), you can either use `pgcli` or some other DB tool to manually run the command `update schema_migrations set version = 4, dirty = false` against your database, or use this (assuming you install `golang-migrate` with brew):

```
brew install golang-migrate
export CONN_STR="postgres://postgres:mysecretpassword@localhost:5432/postgresio?sslmode=disable"
migrate -path apps/platform/migrations -database "$CONN_STR" force 4
```

This will skip running any migrations but update `schema_migrations` table to think you've run them all up through 4

#### testing migrations

To test running migrations (against a separate `pgtest` database alongside your main `postgresio` database for dev), do the following (run from THIS top-level directory!):

```
docker compose up -d
bash apps/platform/migrations_test/test_migrations.sh
```

## Testing (Unit, Integration & E2E)

> ![IMPORTANT]
> The default behavior for all tests is to run against `https://studio.uesio-dev.com:3000` so you must ensure that [SSL](#set-up-ssl) and [local DNS](#set-up-your-local-dns) have been configured.

To run the various test suites, there are a number of commands available:

1. `npm run tests`
   - Runs all Unit tests
2. `npm run tests-all`
   - Runs all Unit, Integration and E2E tests against your local Uesio app.
   - Use this when writing and debugging tests locally
3. `npm run tests-docker`
   - This is what we run in Github Actions [CI](./.github/workflows/ci.yaml) builds for integration & E2E tests. It builds the latest code, spins up all dependencies, and a Dockerized version of the Uesio app, runs integration and E2E tests against the app, and then spins down all Docker containers.
4. `npm run tests-integration`
   - Runs _just_ the Integration Tests (against your local app).
5. `npm run tests-e2e`
   - Runs _just_ the E2E Tests (against your local app).
6. `npm run tests-init`
   - Deletes the `uesio/tests` app if it exists and then creates the `uesio/tests` app with related workspaces and sites and loads seed data.  All of the above scripts execute this script automatically so there is not typically a need to run it.  However, if you want to run individual tests (via hurl, cypress, etc.) separate from one of the above scripts which runs an entire suite, you will need to run this script to prepare for test execution.
7. `npm run tests-cleanup`
   - Removes the `uesio/tests` app (if it exists).  Similar to `tests-init`, the automated test suite scripts will execute this script prior to completion.  However, if a test run terminates abnormally and/or if you ran `tests-init` manually, you can execute this script to remove the test related `uesio/tests` app.
8. `npm run tests-cypress-open`
   - Runs the cypress visual UI where you can run E2E tests from. See [E2E testing with cypress](#e2e-testing-with-cypress) for details.
9. `npm run tests-cypress-run`
   - Runs the cypress in headless mode, helpful when you want to run individual tests. See [E2E testing with cypress](#e2e-testing-with-cypress) for details.

TO run just an individual E2E or Integration test, see the sections below.

> [!NOTE]
> You must manually run `npm run tests-init` in order to run individual tests.  Depending on the test, you may need to re-run this script prior to every test execution.  Additionally, ensure that `UESIO_DEV=true` environment variable is set prior to starting the server and for each test so that mock logins can be used.

### E2E testing with Cypress

We use [Cypress](https://cypress.io) for writing end-to-end tests of the Uesio app. All E2E tests are defined in `apps/platform-e2e` directory.

E2E tests are the most expensive and most brittle, and as such should be used sparingly.

If you're running Uesio locally, you can use `npm run tests-cypress-open` to launch Cypress' visual UI for running tests, or `npm run tests-e2e` to just run all the tests in a headless runner.  Note that when running using the visual UI or when running individual tests as per the below, you must have the `UESIO_DEV=true` environment variable set and have run `npm run tests-init`.

#### Running a single E2E spec

If you want to _visually_ run a single spec, use the Cypress visual UI and then select the individual spec.

Or, use `npm run tests-cypress-run -- --spec <path to spec>` to run a specific file in a headless Electron instance, e.g.

```bash
npx run tests-cypress-run -- --spec apps/platform-e2e/cypress/e2e/builder.cy.ts
```

### Integration / API testing with Hurl

We use [Hurl](https://hurl.dev/) for running integration tests against Uesio APIs, and for performing load testing against APIs. Hurl provides a powerful text-based abstraction over `curl` suitable for defining suites of HTTP requests and assertions to make upon the responses.

To run API integration tests locally against your running Uesio container, use `npm run tests-integration`

#### Running a single Integration Test

The easiest way to run a single Integration Test is to go into the `scripts/tests/start-integration-tests.sh` file and comment out the lines where we run all tests, and uncomment the lines here and then run `npm run tests-integration`:

```
# npx hurl --very-verbose -k --variable host=$UESIO_TEST_HOST_NAME --variable domain=$UESIO_TEST_DOMAIN --variable port=$UESIO_TEST_PORT apps/platform-integration-tests/hurl_specs/wire_collection_dependencies.hurl
```

You could run the individual test from the CLI, but you would have to make sure that you have the test app created and the right environment variables set up. If you would like to run via the CLI:

```bash
npm run tests-init # initialize test app/workspace/site/data/etc.
source scripts/tests/setup-common.sh # setup environment variables used in tests
npx hurl --very-verbose -k --variable host=$UESIO_TEST_HOST_NAME --variable domain=$UESIO_TEST_DOMAIN --variable port=$UESIO_TEST_PORT apps/platform-integration-tests/hurl_specs/wire_collection_dependencies.hurl
```

# Continous integration (CI)

We use **GitHub Actions** for automated builds. All of our workflows live in `./github/workflows`.

## Creating a new release

We use Github Releases to manage releases of:

(a) the Uesio web/worker app - as a Docker image
(b) the Uesio CLI - as a platform-specific binary

Here are the steps to create a new release:

1. In Github, go to [Draft a new release](https://github.com/ues-io/uesio/releases/new)
2. Enter a new tag name, using Semver names (e.g. `v0.5.0`)
3. Click **Generate release notes**
4. Click **Publish release**

That's it! This will kick off the "Release" Github Action, which will download the corresponding Docker image from AWS ECR and re-publish it to Github Container Registry with the corresponding version tag, as well as the `latest` tag. It will also generate CLI binaries for Linux, Windows, and Mac OS.

# Code style

As much as possible, our code style and format is codified with [eslint](https://eslint.org/) and [Prettier](https://prettier.io/). We cherry-picked some rules from the [Airbnb JavaScriopt Style Guide](https://github.com/airbnb/javascript), [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react) and the [React+TypeScript Cheatsheets](https://github.com/typescript-cheatsheets/react).

For Redux, we follow the [Redux Style Guide](https://redux.js.org/style-guide/style-guide) with some exceptions. More details on that [here](#redux-architecture).

For Go **package naming**, we follow this [guideline](https://blog.golang.org/package-names).

# Tech Stack

## Backend

- [Cobra](https://github.com/spf13/cobra). CLI for Go application.
- [gorilla/mux](https://github.com/gorilla/mux). Web framework in Go.
- [goja](https://github.com/dop251/goja). JavaScript engine implemented in Go.

## Frontend

- [Node.js](https://www.nodejs.org/). For package management, building process, and development.
- [TypeScript](https://www.typescriptlang.org/). For strong typing of JavaScript code.
- [React](https://reactjs.org/). Framework for UI components.
- [Redux](https://redux.js.org/). State store for the application's frontend data.
- [Redux-toolkit](https://redux-toolkit.js.org/). Bootstrap for Redux.

## Managing Dependencies

1. We're pinning monaco to version 0.50.0 for now because of this [bug](https://github.com/microsoft/monaco-editor/issues/4654)
2. `nx` and its plugins need to be pinned to specific versions as the version of all of them must match [per their docs](https://nx.dev/recipes/tips-n-tricks/keep-nx-versions-in-sync). Running [npx nx migrate](https://nx.dev/nx-api/nx/documents/migrate) will ensure that all are kept in-sync.
3. When running `npm install` there are errors related to `inflight@1.0.6`, `abab@2.0.6`, `glob@7.2.3`, `domexception@4.0.0` that all are dependencies of jest and its related tooling. There is a jest@next package (currently v30.0.0-alpha.6) that should address most (and hopefully) all of these. See:
   - https://github.com/jestjs/jest/issues/15173
   - https://github.com/jestjs/jest/issues/15236
   - https://github.com/jestjs/jest/issues/15325
4. Unable to update to `eslint-config-prettier` v10 due to `@nx/eslint-plugin` not supporting it yet (https://github.com/nrwl/nx/blob/master/packages/eslint-plugin/package.json#L29)
5. Unable to update to `cypress` v14 due to `@nx/cypress` not supporting it yet (https://github.com/nrwl/nx/blob/master/packages/cypress/package.json#L47)
