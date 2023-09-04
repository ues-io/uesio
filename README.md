# About Uesio

![Uesio Logo](./libs/apps/uesio/core/bundle/files/logo/file/uesioblack.png)

Uesio is a **low-code** application development platform.

# Code style

As much as possible, our code style is embeded in dedicated [eslint](https://eslint.org/) rules.

We use the repo called [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) for having `eslint` working along with TypeScript. This repo is an alternaltive to the [TSLint](https://github.com/palantir/tslint) project which is no longer supported.

[Prettier](https://prettier.io/) is used for **formatting** our source code.

As regards the frontend, we cherry-picked some rules from the [Airbnb JavaScriopt Style Guide](https://github.com/airbnb/javascript), [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react) and the [React+TypeScript Cheatsheets](https://github.com/typescript-cheatsheets/react).

Redux-wise we do follow the [Redux Style Guide](https://redux.js.org/style-guide/style-guide) with some exceptions. More details on that [here](#redux-architecture).

Generally speaking, frontend-side, functional programming style and [unidirectional data flow](https://facebook.github.io/flux/docs/in-depth-overview/) is preferred. All our React components are **functional components**. Some components coming from third-party libraries like [react-monaco-edtor](https://github.com/react-monaco-editor/react-monaco-editor), are not functional components.

As regards the **package naming** in Go, we do follow this [guideline](https://blog.golang.org/package-names).

# Tech Stack

## Backend

-   [Cobra](https://github.com/spf13/cobra). CLI for Go application.
-   [gorilla/mux](https://github.com/gorilla/mux). Web framework in Go.
-   [goja](https://github.com/dop251/goja). JavaScript engine implemented in Go.

## Frontend

-   [Node.js](https://www.nodejs.org/). For package management, building process, for development and for our home-made cli application.
-   [TypeScript](https://www.typescriptlang.org/). Wrapper around JavaScript.
-   [React](https://reactjs.org/). Library for making UI elements.
-   [Redux](https://redux.js.org/). Single source of truth for the entire application's data.
-   [Redux-toolkit](https://redux-toolkit.js.org/). Bootstrap for Redux.

# <a id="redux-architecture"></a> Redux architecture

See the [Uesio Specific Redux Docs](./docs/redux/README.md) on that matter.

# <a id="monorepo-structure"></a> Monorepo structure

The present monorepo hosts several standalone **applications**, such as the `cli`.

Standalone **libraries** are located in the `libs` folder. These libs are components of the applications or container for sharing code between applications and libs.

The monorepo is managed by a tool called [nx](https://nx.dev/).
`nx` has the particularity of having one single `package.json` for the whole monorepo.

The `workspace.json` is the entry point for the **build**, **watcher**, **test**, **linting** processes for the whole monorepo. `nx.json` holds the configuration on dependency of apps/libs - esp. for the build process.

# Set up dev environment

-   Install [homebrew](https://brew.sh/) (for macOS user)
-   Install git
-   Install GitHub Desktop [GitHub Desktop](https://desktop.github.com/)
-   Install [nvm](https://github.com/nvm-sh/nvm) (for installing Node.js and npm)
-   Install the latest version of Node.js _via_ `nvm`: `nvm install node`
-   Install [Go](https://golang.org/dl/)
-   Install the following brew packages:
    -   `hurl` (for integration tests): `brew install hurl`
    -   `jq` (for JSON manipulation in Shell): `brew install jq`
    -   `wget` (for fetching URLs): `brew install wget`
-   Install [VS Code](https://code.visualstudio.com/Download) and plugins (ESLint, Prettier, Go, GitLens). Do enable `format on save` in conjunction with the `Prettier`. Set up the `code` [environment variable](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line).
-   Install the following [Google Chrome plugins](https://chrome.google.com/webstore) : `React Developers Tools`, `Redux DevTools`.
-   _Optional_. Install [Oh My Zsh](https://ohmyz.sh/)
-   _Optional_. [Add a SSH key to your github account](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
-   _Optional_. Install the `nx` cli globally: `npm i -g nx`
-   Use Git clone and store this repository in your local machine
-   Set up SSL [here](#set-up-ssl).
-   Set up local DNS [here](#set-up-local-dns).
-   Start dependencies [here](#dependencies).
-   Create a symlink for the Uesio CLI into your bin (NOT an alias, which won't work with `nx`):
    -   Mac OS: `sudo ln -s ~/git/uesio/dist/cli/uesio /usr/local/bin`
    -   Windows: `mklink C:\bin\uesio C:\Users\<USERNAME>\git\uesio\dist\cli\uesio`, and ensure `bin` is on path: `setx PATH "C:\bin;%PATH%`
-   Build and run [here](#run).

---

    ```
    npm run dev
    ```

-   _Optional_. Create a file called `launch.json` located in `apps/.vscode` for the uesio server debugger in Go and paste the following :

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

-   Download and install the npm module dependencies :

```
npm install
```

## Build all applications and libs

```
npm run build-all
```

## Build a dedicated app (no watcher and no source map)

```
cd ./libs/apps/uesio/crm && uesio pack

// or
npm run nx -- build apps-uesio-crm

// or, if you have nx globally
nx build apps-uesio-crm
```

## Build a dedicated app (with watcher and source map)

On the frontend, the `source map` is enabled in webpack in `dev` mode. While developing you might want to rebuild on saving with the source map in the browser :

```
cd ./libs/apps/uesio/core && uesio pack --develop
```

# Watch mode

While developing you may want the entire monorepo to rebuild upon file saving.

```
npm run watch-all

// terminating that script does not kill
// the watcher jobs running in background in parallel.
// For killing all of them, do run `killall node`
```

As a side note, the `dev` npm script does include this `watch-all` npm script.

# Uesio apps deployment

**Uesio apps** such as the **uesio crm** are applications which can be plugged into the uesio system. These uesio apps are located in the `apps` directory which is located under the `libs` folder.

For plugging such an application into uesio, you have to deploy it, **obviously after having built it**. This deployment process is done by the `cli`.

```
cd ./libs/apps/uesio/crm && uesio deploy

// or
npm run nx -- deploy apps-uesio-crm

// or, if you have nx globally
nx deploy apps-uesio-crm
```

The `uesio` lib under `apps/uesio` does **not** need to be **deployed**. The backend is directly accessing the related files part of that lib.

An **app bundle** is a screenshot or version of a specific uesio app.

# Continous integration (CI)

The **continous integration** process is done through the cloud service offered by GitHub, namely **GitHub Actions**. The configuration is held in the file called `nx-affected.yml`.

# <a id="set-up-ssl"></a> Set up SSL

```
npm run setup-ssl
```

This script should create the `certificate.crt` and `private.key` files in the `apps/platform/ssl` directory. You will need to configure your operating system to trust this self-signed certificate.

In windows, double-click certificate.crt in the File Explorer. Click "Install Certificate..." Then place the certificate in the "Trusted Root Certification Authorities".

In mac, double-click certificate.crt in Finder. Right-click on the uesio-dev.com certificate and select "Get Info". Expand the "Trust" section and set it to "Always Trust".

# <a id="set-up-local-dns"></a> Set up your local DNS

On Mac/Linux, modify the `/etc/hosts` file to resolve local subdomains to 127.0.0.1

```
bash ./scripts/seed-etc-hosts.sh
```

Mac users can also use a service called dnsmasq for managing local DNS.

```
brew install dnsmasq
```

The installation process will output several commands that you can use to start Dnsmasq automatically with a default configuration. I used the following commands but you should use whichever commands brew tells you to:

```
sudo brew services start dnsmasq
```

                                                    |

# <a id="dependencies"></a>Start dependencies

1. Launch all local dependencies (e.g. Postgres) with Docker Compose:

```
docker compose up -d
```

2. Seed your local Postgres database with everything Uesio needs for local development

```
npm run nx -- seed platform
```

# <a id="dependencies"></a>Run the (web) application locally

To run the app locally:

```
npm run nx -- serve platform
open https://uesio-dev.com:3000
```

To run the app in Docker locally:

```
npm run in-docker
open https://uesio-dev.com:3000
```

**NOTE**: Docker Compose aggressively caches, so to force the app to rebuild the image (e.g. to rebuild JS / Go source), use this instead:

```
npm run in-docker-force-build
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

Do define the following environment variables in `~/.zshenv`. (If you are using Oh My Zsh)

| Environment Variable         | Description                                                                                | Examples, Values & Help                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| UESIO_USE_HTTPS              | Use ssl or not                                                                             | true or false                                                                           |
| HOST                         | Host to use for HTTP server. Set to "localhost" for local development                      | Defaults to ""                                                                          |
| UESIO_SESSION_STORE          | Allows you to specify a storage location for user sessions.                                | filesystem or "" (Can be either empty, or "filesystem" if you want sessions to persist) |
| UESIO_PLATFORM_BUCKET        | The Bucket in AWS file uploads will be populated to if using the useio.platform filesource |                                                                                         |
| UESIO_STATIC_ASSETS_HOST     | Host from which to serve static files, including vendored JS (React) and Uesio assets      | Defaults to "" (assets served from local filesystem / Docker container)                 |
| UESIO_ALLOW_INSECURE_COOKIES | Allows cookies without the secure flag (Useful in local docker envirnments)                | true                                                                                    |
| UESIO_LOCAL_FILES            | Set to "true" to have the uesio.platform filesource save files to the file system          | true                                                                                    |
| UESIO_MOCK_AUTH              | Allows the use of mocked users                                                             | true                                                                                    |
| COGNITO_CLIENT_ID            | Client Id for a Cognito Pool Device                                                        |                                                                                         |
| COGNITO_POOL_ID              | Pool Id for a Cognito Pool                                                                 |                                                                                         |

# npm dependencies

As mentioned in the [monorepo](#monorepo-structure) section, a single `package.json` file describes the npm dependencies for the whole monorepo.

All npm modules we used are installed as `development` dependency since uesio is not intended to be released as standalone npm module.

Most of commmands you might run related to npm modules.

-   Install a new dependency :

```
  npm install lodash.isempty -D
```

-   Update minor changes (no breaking changes) of an existing dependency :

```
  npm update react -D
```

-   Major update and latest (with breaking changes) of an existing dependency :

```
  npm install react@latest -D
```

-   List all dependencies of the monorepo and the related version :

```
  npm list --depth=0
```

-   Remove a dependency :

```
  npm uninstall lodash.isempty -D
```

-   List dependencies having newer versions :

```
  npm outdated
```

-   Update minor changes (no breaking changes) all dependencies :

```
  npm update
```

# Create Docker Image and push to GCP

1. `nx build-image platform`

2. `docker tag uesio:latest us-east1-docker.pkg.dev/uesio-317517/uesio/uesio:latest`

3. `docker push us-east1-docker.pkg.dev/uesio-317517/uesio/uesio:latest`

### Migrations

We use `golang-migrate` package for running SQL migrations. This package maintains the current state of migration runs via a `schema_migrations` table.

#### install

```
brew install golang-migrate
```

#### adding migrations

New migrations can be created using `npm run migrate:create -- <SOME_NAME>`

#### manually setting the migration "pointer"

To forcibly set the migration version to latest (currently 3), use:

```
export CONN_STR="postgres://postgres:mysecretpassword@localhost:5432/postgresio?sslmode=disable"
migrate -path apps/platform/migrations -database "$CONN_STR" force 3
```

This will skip running any migrations but update `schema_migrations` table to think you've run them all up through 3

#### testing migrations

To test running migrations (against a separate `pgtest` database alongside your main `postgresio` database for dev), do the following (run from THIS top-level directory!):

```
docker compose up -d
bash apps/platform/migrations_test/test_migrations.sh
```

## End-to-end Testing and Integration testing

All E2E and integration tests can be run exactly as they would in CI using `npm run tests-all`. This will spin up all dependencies, and a Dockerized version of the app, run integration and E2E tests against the app, and then spin down dependencies.

### E2E testing with Cypress

We use [Cypress](https://cypress.io) for writing end-to-end tests of the Uesio app. All E2E tests are defined in `cypress/e2e` directory.

E2E tests are the most expensive and most brittle, and as such should be used sparingly.

If you're running Uesio locally, you can use `npx cypress open` to launch Cypress' visual UI for running tests, or `npm run tests-e2e` to just run the tests in a headless runner.

To simulate how Cypress tests are run in CI, run `npm run tests-e2e`. This script is run in Github Actions on master build, and spins up the Uesio app in Docker, along with all dependencies, to use for running tests.

### Integration / API testing with Hurl

We use [Hurl](https://hurl.dev/) for running integration tests against Uesio APIs, and for performing load testing against APIs. Hurl provides a powerful text-based abstraction over `curl` suitable for defining suites of HTTP requests and assertions to make upon the responses.

To run API integration tests locally against your running Uesio container, use `npm run tests-integration`
