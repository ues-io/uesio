# About Uesio

![Uesio Logo](./libs/apps/uesio/core/bundle/files/favicon/uesiofav.svg)

Uesio is a **low-code** application development platform.

# Set up dev environment

## Required

- Install [homebrew](https://brew.sh/) (for macOS user)
- Install git
- Install GitHub Desktop [GitHub Desktop](https://desktop.github.com/)
- Install [nvm](https://github.com/nvm-sh/nvm) (for ensuring that your version of Node.js matches the [version](./.nvmrc) used in the repo): `nvm install`
- Install [Go](https://golang.org/dl/)
- Install the following brew packages:
  - `jq` (for JSON manipulation in Shell): `brew install jq`
  - `wget` (for fetching URLs): `brew install wget`
- [Configure environment variables](#environment-variables)
- [Start dependencies](#dependencies)
- [Build](#build)
- [Run](#run)

## Optional

- Set up SSL [here](#set-up-ssl-for-localhost). If you don't set up SSL locally and you still want to run multiple sites locally in addition to the ues.io studio, you will need to set the `UESIO_ALLOW_INSECURE_COOKIES` environment variable to `true`
- Set up local DNS [here](#set-up-your-local-dns-advanced). This is only necessary if you want to setup a [custom domain for local development](#custom-domain-for-local-development) (e.g., `dev.mylocaluesio.com` pointing to your local machine)
- Install [VS Code](https://code.visualstudio.com/Download) and plugins (ESLint, Prettier, Go, GitLens). Do enable `format on save` in conjunction with the `Prettier`. Set up the `code` [environment variable](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line).
- Install the following [Google Chrome plugins](https://chrome.google.com/webstore) : `React Developers Tools`, `Redux DevTools`.
- Install [Oh My Zsh](https://ohmyz.sh/)
- [Add a SSH key to your github account](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- Install the `nx` cli globally: `npm i -g nx`
- An alternative to installing `nx` globally is to set an alias in your `~/.zshrc` file or equivalent: `alias nx="npx nx"`. This way your global nx version will always be the correct version.
- _Optional_. Create a file called `launch.json` located in `apps/.vscode` for the uesio cli & server debugger in Go and paste the following:

```
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
      {
        "name": "Platform Serve",
        "type": "go",
        "request": "launch",
        "mode": "auto",
        "program": "${workspaceRoot}/apps/platform",
        "envFile": "${workspaceRoot}/.env",
        "cwd": "${workspaceRoot}/apps/platform",
        "args": ["serve"]
      },
      {
        "name": "CLI Status",
        "type": "go",
        "request": "launch",
        "mode": "auto",
        "program": "${workspaceRoot}/apps/cli",
        "envFile": "${workspaceRoot}/.env",
        "console": "integratedTerminal",
        "cwd": "${workspaceRoot}/_workspaces",
        "args": ["status"]
      }
  ]
}
```

# Build

> [!NOTE]
> By default, production builds (e.g., minified) will be created. To create development builds (e.g., not minified), set the environment variable `NODE_ENV` to `development` prior to running any build related commands (e.g., `NODE_ENV=development npm run build-all` or add `NODE_ENV=development` to `.env` file).

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
npx nx run apps-uesio-studio:build
```

## Watch mode (for development)

While developing you may want the entire monorepo to rebuild changed files. You can do this with:

```bash
npm run watch-all
```

Or, if you want to watch just a single project, you can do the following which will watch the project for changes and ensure that any of the projects its dependent on are (re)built (if needed) first:

`npx nx watch -p <projectname> --includeDependentProjects -- nx run-many -t build -p \$NX_PROJECT_NAME`

For example, to monitor the `apps-uesio-studio` project:

```bash
npx nx watch -p apps-uesio-studio --includeDependentProjects -- nx run-many -t build -p \$NX_PROJECT_NAME
```

## Live Reload (for development)

> [!NOTE]
> Live reload is not currently supported when running against the docker image (e.g., `npm run in-docker`).

When running the platform, in addition to [watching](#watch-mode-for-development) and rebuilding when files change, you likely want to have the platform itself and/or the browser to automatically reload after assets have been rebuilt.

See [Live Reload](./docs/development/live-reload.md) for more details on how live reload works.

Depending on your preference, there are two options:

### Platform & Browser

Whenever any changes are made to code within the platform go module itself or any of the libraries that are a part of the platform itself (e.g., `libs/apps/uesio/studio`, `libs/apps/uesio/appkit`, `libs/ui`, `libs/vendor`, etc.) the module/package will be rebuilt and if necessary, the platform automatically restarted. Additionally, the browser will automatically refresh.

In order to accomplish, the [Air](https://github.com/air-verse/air) package must be installed on your machine. This is a one-time installation:

```bash
go install github.com/air-verse/air@latest
```

Once `Air` is installed, you can simply run the following:

```bash
npm run watch-dev
```

### Browser Only

Whenever any changes are made to code within the libraries that the platform uses (e.g., `libs/apps/uesio/studio`, `libs/apps/uesio/appkit`, `libs/ui`, `libs/vendor`, etc.), the module/package will be rebuilt and the browser reloaded. This is very similar to [Platform & Browser](#platform--browser) but changes to the platform itself (e.g., `*.go` files) will not trigger a rebuild or a restart of the platform go module.

It is recommended to use [Platform & Browser](#platform--browser) for live reload, however `Browser Only` can be used if you do not want to install `Air` or if you know you will not be making any changes to the platform module directly.

```bash
npm run watch-platform-deps # In a separate terminal
npm run start # In a separate terminal
```

## (Optional) Using Uesio CLI globally

If you'd like to use the Uesio CLI that you have built elsewhere on your machine without having to explicitly reference the binary in `dist/cli`:

- Linux/macOS: create a symlink for the Uesio CLI into your bin (NOT an alias, which won't work with `nx`): `sudo ln -s <absolute project root path>/dist/cli/uesio /usr/local/bin`
- Windows: add `<absolute project root path>/dist/cli` to your PATH

# <a id="dependencies"></a>Start dependencies

1. Launch all local dependencies (e.g. Postgres, Redis) in docker:

```
npm run start-deps
```

2. Seed your local Postgres database with everything Uesio needs for local development

```
npm run migrations
npm run seeds
```

# <a id="run"></a>Run the web application locally

```
npm run start
open http://studio.uesio.localhost:3000
```

If you have setup [SSL](#set-up-ssl-for-localhost) you can access the Studio via the following:

```
open https://studio.uesio.localhost:3000
```

To run the app in Docker locally:

```
npm run in-docker
open https://studio.uesio.localhost:3000
```

# Set up SSL for localhost

SSL is optional for local development. In addition to generating an ssl certificate, you must enable the platform to use SSL by setting the environment variable `UESIO_USE_HTTPS=true` (e.g., in your .env file).

The below steps will generate an SSL certificate with subject and subject alternate names for `uesio.localhost` and `*.uesio.localhost` which is all that is needed to run the uesio platform. If you'd like to configure your local environment to use a custom domain (e.g., `dev.mylocaluesio.com`) pointing to your local machine, see the section [Custom domain for local development](#custom-domain-for-local-development).

```
npm run setup-ssl
```

This script will create the `certificate.crt` and `private.key` files in the `apps/platform/ssl` directory. It will also attempt to register it as a trusted certificate based on your operating system (Linux, macOS).

If you are running uesio in WSL but want to access the site from the Windows side, you can trust the certificate:

1. Double-click the certificate.crt file in the File Explorer to open the Certificate dialog
2. Choose "Install Certificate..." on the "Certificate->General" tab of the Certificate dialog
3. Choose "Current User" on the "Certificate Import Wizard" page 1 and click "Next"
4. Choose "Place all certificates in the following store" on the "Certificate Import Wizard" page 2
5. Choose "Browse" on "Certificate Import Wizard" page 2, select "Trusted Root Certification Authorities" and then click "OK"
6. Choose "Next" on "Certificate Import Wizard" page 2
7. Choose "Finish" on "Certificate Import Wizard" page 3
8. Choose "Yes" on the "Security Warning" dialog which warns that uesio.localhost cannot be validated
9. Choose "OK" on the confirmation dialog indicating the import was successful
10. Choose "OK" on the Certificate dialog to dismiss it

## `UESIO_USE_HTTPS` Details

In a standard production environment behind a load balancer, the value of `UESIO_USE_HTTPS` will typically be `false`. However, when `false`, the platform should still ensure that any outbound requests to any site running on the same platform
use `https` since those sites are accessed via `https`. Generally speaking, relative paths are used for routes, etc. so this differentiation does not come in to play. However, since uesio bots, integrations, etc. can use absolute URLs to access
other sites on the platform and/or externally, it is important that when its another site on the same platform that it use `https` for the request. In this case, there is a need to differentiate between what the uesio platform
is listening for requests on and what it is making requests to. To accomodiate these options, the following values define how `HTTPS_USE_HTTPS` is interpreted:

1. `false` (default) - Uesio will listen for `http` and `$Site{scheme}` merge will resolve to `https` EXCEPT for when `UESIO_PRIMARY_DOMAIN` is `localhost` or ends with `.localhost` in which case it will resolve to `http`
   - This is the recommended configuration for when uesio is behind a local balancer or when running in development against a `localhost` based domain such as the default of `uesio.localhost`
2. `true` - Uesio will listen for `https` and `$Site{scheme}` merge will resolve to `https`
   - This is the recommended configuration when uesio is not behind a load balancer
3. `never` - Uesio will listen for `https` and `$Site{scheme}` merge will resolve to `http`
   - This is a seldom used configuration and should only be used when running in a development environment against a custom domain and wanting to use `http` for listening.

# Custom domain for local development

> [!NOTE]
> Whenever you change the value of `UESIO_PRIMARY_DOMAIN` to a different non-empty value, you must re-run steps 2 & 3 below after each change you make since the generated certificate will only contain
> subject alternate names for `uesio.localhost` and your current `UESIO_PRIMARY_DOMAIN` by default. See the advanced usage for [ssl](#set-up-ssl-for-custom-domain-advanced) and [local dns](#set-up-local-dns-advanced)
> regarding configuring multiple domains to avoid having to run steps 2 & 3 after each change.

If you'd like to be able to access your local development environment via a custom domain (e.g., `dev.mylocaluesio.com`) either via http or https, you will need to perform the following:

1. Update your `.env`:
   - HTTP Settings
     ```bash
     UESIO_PRIMARY_DOMAIN=<domainname>  #(e.g., UESIO_PRIMARY_DOMAIN=dev.mylocaluesio.com)
     UESIO_ALLOW_INSECURE_COOKIES=true
     UESIO_USE_HTTPS=never # see "UESIO_USE_HTTPS" Details section for more information
     ```
   - HTTPS Settings
     ```bash
     UESIO_PRIMARY_DOMAIN=<domainname>  #(e.g., UESIO_PRIMARY_DOMAIN=dev.mylocaluesio.com)
     UESIO_USE_HTTPS=true
     ```
2. `npm run setup-ssl`
3. `npm run setup-local-dns`

After starting the server (e.g., `npm run start`), you can access your studio site at `http://studio.dev.mylocaluesio.com` or `https://studio.dev.mylocaluesio.com` if you configure HTTPS.

> [!NOTE]
> If you are running WSL on Windows and want to be able to access the site from your Windows machine, please see the [advanced local dns](#set-up-local-dns-advanced) section.

## Set up SSL for custom domain (Advanced)

To configure multiple custom domains in a single SSL certificate, you can execute the following which will include `uesio.localhost`, your currently configured `UESIO_PRIMARY_DOMAIN` (if set), and any domains you specify in the generated certificate:

```bash
npm run setup-ssl -- first.domain second.domain third.domain`
```

## Set up local DNS (Advanced)

> [!NOTE]
> Configuring local DNS is only required when using a custom domain via `UESIO_PRIMARY_DOMAIN` that does not end in `.localhost`.

To configure multiple custom domains in local dns, there are two options:

1. Modify your "hosts" file:
   - Linux/macOS - choose one of the following:
     1. Create the default subdomain entries (studio/tests/docs) for each primary domain by running:
        ```bash
        npm run setup-local-dns -- myuesio.com youruesio.com dev.foobar.com
        ```
     2. Manually modify `/etc/hosts` for any custom domains that you want to use specifying a studio.<domain>, docs.<domain> & tests.<domain> entry
        ```text
        127.0.0.1    studio.myuesio.com docs.myuesio.com tests.myuesio.com
        127.0.0.1    studio.youruesio.com docs.youruesio.com tests.youruesio.com
        127.0.0.1    studio.dev.foobar.com docs.dev.foobar.com tests.dev.foobar.com
        ```
   - WSL: No modifications are required on the Linux side, but the following is required for the Windows side. Note that you must have elevated priviledges to modify the hosts file.
     1. Manually modify `%WINDIR%\system32\drivers\etc\hosts` for any custom domains that you want to use specifying a studio.<domain>, docs.<domain> & tests.<domain> entry
        ```text
        127.0.0.1    studio.myuesio.com docs.myuesio.com tests.myuesio.com
        127.0.0.1    studio.youruesio.com docs.youruesio.com tests.youruesio.com
        127.0.0.1    studio.dev.foobar.com docs.dev.foobar.com tests.dev.foobar.com
        ```
2. Use DNSMasq - See [dnsmasq](https://dnsmasq.org/doc.html) docs for details on how to install and configure.

### Adding a uesio site to local DNS

The default behavior of the steps above will ensure that you can access `studio.<mydomain>`, `tests.<mydomain>` and `docs.<mydomain>` domains locally. These are the standard uesio site domains that are required for runtime and running tests.

If you create a site in your uesio instance locally and want to access it using a custom domain, you must also add the full domain to the site to local DNS (this is not required when using `*.localhost` domains). For example, let's say you
set your `UESIO_PRIMARY_DOMAIN` to `myuesio.com` and then created an app in uesio called `mycoolapp`, created a `dev` workspace for it, packaged it and created a site for it using Studio. By default, the site would be accessible at
`http://mycoolapp.myuesio.com` but that domain would not be reachable by DNS. Assuming you have already completed the steps in [set up local dns](#set-up-local-dns-advanced), to add `mycoolapp.myuesio.com` to DNS:

1. Modify your "hosts" file:
   - Linux/MacOS - choose one of the following:
     1. Create the subdomain entries by running:
        ```
        npm run setup-local-dns -e mycoolapp.myuesio.com
        ```
     2. Manually modify `/etc/hosts` to contain the following:
        ```
        127.0.0.1 mycoolapp.myuesio.com
        ```
   - WSL: No modifications are required on the Linux side, but the following is required for the Windows side. Note that you must have elevated priviledges to modify the hosts file.
     1. Manually modify `%WINDIR%\system32\drivers\etc\hosts` to contain the following:
        ```text
        127.0.0.1 mycoolapp.myuesio.com
        ```
2. Use DNSMasq - See [dnsmasq](https://dnsmasq.org/doc.html) docs for details on how to install and configure.

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

# <a id="environment-variables"></a> Environment Variables

If you'd like to get started immediately, you can run `npm run in-docker` and access the site via http://studio.uesio.localhost:3000.

In order to run locally via `npm run start`, you must configure the required environment variables.

1. Copy the [environment template](./.env.template) to `.env`:

```bash
cp .env.template .env
```

2. Set the values for the required variables near the top of the file:

```text
# Required
UESIO_DB_USER=postgres
UESIO_DB_PASSWORD=mysecretpassword
UESIO_DB_DATABASE=postgresio
UESIO_MOCK_AUTH=true
UESIO_DEV=true
UESIO_DEBUG_SQL=true
```

3. The above is enough to run the platform, however by default, the server will run with in-memory cache and `INFO` level logging. The following recommended configuration will enable redis for caching, set verbose logging and run the uesio worker in the same process as the server:

```text
# Recommended
UESIO_LOG_LEVEL=-4
UESIO_SESSION_STORE=redis
UESIO_PLATFORM_CACHE=redis
UESIO_USAGE_HANDLER=redis
UESIO_WORKER_MODE=combined
```

4. Optionally, you can set any of the other `UESIO_` environment variables although the ones above are a great starting point.

| **Environment Variable**                       | **Description**                                                                                                       | **Default**                                                                               | **Examples, Values, and Help**                                                                                                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UESIO_USE_HTTPS                                | Whether or not to serve with TLS                                                                                      | false                                                                                     | `true`, `false`, `never` (see [details](#uesio_use_https-details))                                                                                                         |
| UESIO_HOST                                     | Host to use for HTTP server                                                                                           |                                                                                           | By default, will listen on all available interfaces                                                                                                                        |
| UESIO_PORT                                     | Port to use for HTTP server                                                                                           | 3000                                                                                      |                                                                                                                                                                            |
| UESIO_PRIMARY_DOMAIN                           | The primary domain to use for site identification purposes (e.g. for ues.io cloud, this is "ues.io")                  | uesio.localhost                                                                           | If running with a custom domain, set to your root domain (e.g. `mydomain.com` to have studio available at `studio.mydomain.com`)                                           |
| UESIO_SESSION_STORE                            | Allows you to specify the storage location for user sessions                                                          | memory                                                                                    | `redis`, `memory`, `filesystem`                                                                                                                                            |
| UESIO_PLATFORM_CACHE                           | Determines whether to handle the platform cache in memory on the web server, or to use redis for multiple web servers | memory                                                                                    | `redis`, `memory`                                                                                                                                                          |
| UESIO_USAGE_HANDLER                            | Determines whether to handle usage in memory on the web server, or to use redis for multiple web servers              | memory                                                                                    | `redis`, `memory`                                                                                                                                                          |
| UESIO_USERFILES_BUCKET_NAME                    | The Bucket in AWS / local folder where user-uploaded files will be stored                                             | uesio-userfiles                                                                           |                                                                                                                                                                            |
| UESIO_BUNDLES_BUCKET_NAME                      | The Bucket in AWS / local folder where bundles will be stored.                                                        | uesio-bundles                                                                             |                                                                                                                                                                            |
| UESIO_STATIC_ASSETS_HOST                       | Host from which to serve static files, including vendored JS (React) and Uesio assets                                 |                                                                                           | By default, assets are served from the local filesystem / Docker container. Alternately, set this to a valid URL where Uesio static assets live, e.g. `https://www.ues.io` |
| UESIO_ALLOW_INSECURE_COOKIES                   | Allows cookies without the secure flag                                                                                | false                                                                                     | Ignored when `UESIO_USE_HTTPS=true`, useful in local docker development when using custom domains & HTTP                                                                   |
| UESIO_PLATFORM_FILESOURCE_TYPE                 | Controls where user-uploaded files are stored                                                                         | uesio.local                                                                               | Either `uesio.local` (filesystem) or `uesio.s3` (store in AWS S3)                                                                                                          |
| UESIO_PLATFORM_FILESOURCE_CREDENTIALS          | The name of the Uesio credential to use for saving user-uploaded files                                                | uesio/core.localuserfiles                                                                 | Must be a fully-qualified Uesio credential name                                                                                                                            |
| UESIO_PLATFORM_BUNDLESTORE_TYPE                | Controls where Uesio bundles are stored                                                                               | uesio.local                                                                               | Either `uesio.local` (filesystem) or `uesio.s3` (store in AWS S3)                                                                                                          |
| UESIO_PLATFORM_BUNDLESTORE_CREDENTIALS         | The name of the Uesio credential to use for saving bundlestore files                                                  | uesio/core.localuserfiles                                                                 | Must be a fully-qualified Uesio credential name                                                                                                                            |
| UESIO_DEV                                      | Enable various features for use in local development of Uesio                                                         | false                                                                                     |                                                                                                                                                                            |
| UESIO_DEBUG_SQL                                | Enable detailed SQL query debugging                                                                                   | false                                                                                     | If enabled, all Wire loads will return a `debugQueryString` property containing the SQL queries made                                                                       |
| UESIO_MOCK_AUTH                                | Enables you to login with mock user accounts                                                                          | false                                                                                     | Only for local dev / unit tests                                                                                                                                            |
| UESIO_GRACEFUL_SHUTDOWN_SECONDS                | The number of seconds to wait before terminating the Uesio app / worker process                                       | 5 (0 when `UESIO_DEV=true`)                                                               | Should be less than whatever the ECS / Kubernetes / etc shutdown window is (usually 30)                                                                                    |
| UESIO_USAGE_JOB_RECURRENCE_MINUTES             | The number of minutes to wait between runs of the Usage worker job                                                    | 10                                                                                        | Interval between 1-30 to aggregate and commit usage data to Postgres by the worker process. Set to a lower window for more frequent checks.                                |
| UESIO_WORKER_MODE                              | Determines whether the batch job worker will run as part of the serve command or as a separate process                | separate                                                                                  | `separate` (worker will run as a separate process), `combined` (worker will run as part of the serve command)                                                              |
| UESIO_REDIS_HOST                               | The host to connect to Redis                                                                                          | localhost                                                                                 |                                                                                                                                                                            |
| UESIO_REDIS_PORT                               | The port to connect to Redis                                                                                          | 6739                                                                                      |                                                                                                                                                                            |
| UESIO_REDIS_USER                               | The Redis Username (If Necessary)                                                                                     |                                                                                           |                                                                                                                                                                            |
| UESIO_REDIS_PASSWORD                           | The Redis Password (If Necessary)                                                                                     |                                                                                           |                                                                                                                                                                            |
| UESIO_REDIS_TTL                                | Redis TTL Seconds                                                                                                     | 86400                                                                                     |                                                                                                                                                                            |
| UESIO_REDIS_TLS                                | Whether or not to use TLS Mode                                                                                        | false                                                                                     | `true`, `false`                                                                                                                                                            |
| UESIO_DB_USER                                  | Postgres username                                                                                                     |                                                                                           |                                                                                                                                                                            |
| UESIO_DB_PASSWORD                              | Postgres password                                                                                                     |                                                                                           |                                                                                                                                                                            |
| UESIO_DB_DATABASE                              | Postgres database name                                                                                                |                                                                                           |                                                                                                                                                                            |
| UESIO_DB_HOST                                  | Postgres host name                                                                                                    | localhost                                                                                 |                                                                                                                                                                            |
| UESIO_DB_PORT                                  | Postgres port                                                                                                         | 5432                                                                                      |                                                                                                                                                                            |
| UESIO_DB_SSLMODE                               | Postgres sslmode                                                                                                      | disable                                                                                   | `disable`, `allow`, `prefer`, `require`, etc.                                                                                                                              |
| UESIO_LOG_LEVEL                                | Logging level                                                                                                         | 0                                                                                         | `-4` (Debug), `0` (Info), `4` (Warn), `8` (Error)                                                                                                                          |
| UESIO_BUILD_VERSION                            | Used in urls served for cache busting                                                                                 | Empty string in development mode / Docker image contains the version image was built with | There is typically no need to provide this, see [http caching docs](./docs/http_caching.md)                                                                                |
| UESIO_CACHE_SITE_BUNDLES                       | Whether or not to cache site bundles                                                                                  | true                                                                                      |                                                                                                                                                                            |
| UESIO_CACHE_BOT_PROGRAMS                       | Whether or not to cache bot programs                                                                                  | true                                                                                      |                                                                                                                                                                            |
| UESIO_CACHE_WORKSPACE_BUNDLES                  | Whether or not to cache workspace bundles                                                                             | true                                                                                      |                                                                                                                                                                            |
| UESIO_WORKSPACE_CACHE_INVALIDATION_ITEMS_CHUNK | The number of items to include in a batch/chunk when saving metadata                                                  | 20                                                                                        | Integer value must be greater than zero                                                                                                                                    |
| UESIO_AWS_ACCESS_KEY_ID                        | AWS access key id                                                                                                     |                                                                                           |                                                                                                                                                                            |
| UESIO_AWS_SECRET_ACCESS_KEY                    | AWS secret access key                                                                                                 |                                                                                           |                                                                                                                                                                            |
| UESIO_AWS_SESSION_TOKEN                        | AWS session token                                                                                                     |                                                                                           |                                                                                                                                                                            |
| UESIO_AWS_REGION                               | AWS region                                                                                                            |                                                                                           |                                                                                                                                                                            |
| UESIO_AWS_ENDPOINT                             | AWS endpoint                                                                                                          |                                                                                           |                                                                                                                                                                            |
| UESIO_CLI_USERNAME                             | Username to use when executing CLI                                                                                    |                                                                                           |                                                                                                                                                                            |
| UESIO_CLI_PASSWORD                             | Password to use when executing CLI                                                                                    |                                                                                           |                                                                                                                                                                            |
| UESIO_CLI_LOGIN_METHOD                         | Login method to use when executing CLI                                                                                |                                                                                           | `uesio/core.platform`, `uesio/core.mock`                                                                                                                                   |
| UESIO_CLI_HOST                                 | Host to interact with when executing CLI                                                                              |                                                                                           |                                                                                                                                                                            |
| UESIO_EXTERNAL_BUNDLE_STORE_BASE_URL           | Base url for external bundle store                                                                                    | https://studio.ues.io                                                                     |                                                                                                                                                                            |

5. In addition, all Uesio Secrets can have their default value set by setting a corresponding `UESIO_SECRET_<namespace>_<name>` environment variable. Any value set for these secrets in a Site/Workspace will override the environment variable default, but it can often be useful, especially for local development, to configure a default value, so that you don't have to populate these secrets in every site. (Note: there is no corresponding feature for Config Values, because you can define a Config Value's default directly in the metadata definition).

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

> [!IMPORTANT]
> The default behavior for all tests is to run against `http://studio.uesio.localhost:3000` although tests will execute based on the settings in your environment (or `.env` file), for example, `UESIO_USE_HTTPS` will run tests against `https`.

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
   - Deletes the `uesio/tests` app if it exists and then creates the `uesio/tests` app with related workspaces and sites and loads seed data. All of the above scripts execute this script automatically so there is not typically a need to run it. However, if you want to run individual tests (via hurl, cypress, etc.) separate from one of the above scripts which runs an entire suite, you will need to run this script to prepare for test execution.
7. `npm run tests-cleanup`
   - Removes the `uesio/tests` app (if it exists). Similar to `tests-init`, the automated test suite scripts will execute this script prior to completion. However, if a test run terminates abnormally and/or if you ran `tests-init` manually, you can execute this script to remove the test related `uesio/tests` app.
8. `npm run tests-cypress-open`
   - Runs the cypress visual UI where you can run E2E tests from. See [E2E testing with cypress](#e2e-testing-with-cypress) for details.
9. `npm run tests-cypress-run`
   - Runs the cypress in headless mode, helpful when you want to run individual tests. See [E2E testing with cypress](#e2e-testing-with-cypress) for details.

To run just an individual E2E or Integration test, see the sections below.

> [!NOTE]
> You must manually run `npm run tests-init` in order to run individual tests unless otherwise specified below. Depending on the test, you may need to re-run this script prior to every test execution. Additionally, ensure that `UESIO_DEV=true` environment variable is set prior to starting the server so that mock logins can be used.

### E2E testing with Cypress

We use [Cypress](https://cypress.io) for writing end-to-end tests of the Uesio app. All E2E tests are defined in `apps/platform-e2e` directory.

E2E tests are the most expensive and most brittle, and as such should be used sparingly.

If you're running Uesio locally, you can use `npm run tests-cypress-open` to launch Cypress' visual UI for running tests, or `npm run tests-e2e` to just run all the tests in a headless runner. Note that when running using the visual UI you must first manually run `npm run tests-init`.

#### Running a single E2E spec

If you want to _visually_ run a single spec, use the Cypress visual UI and then select the individual spec.

Or, use `npm run tests-cypress-run -- --spec <path to spec> <...other cypress options>` to run a specific file in a headless Electron instance, e.g.,

```bash
npx run tests-cypress-run -- --spec apps/platform-e2e/cypress/e2e/builder.cy.ts --browser chrome
```

If you want to run a single spec in headless mode and avoid having to run `npm run tests-init` prior to each test run, you can use `npx nx run platform-e2e:run-test --spec <path to spec> <...other cypress options>`, e.g.,

```bash
npx nx run platform-e2e:run-test --spec apps/platform-e2e/cypress/e2e/builder.cy.ts --browser chrome
```

### Integration / API testing with Hurl

We use [Hurl](https://hurl.dev/) for running integration tests against Uesio APIs, and for performing load testing against APIs. Hurl provides a powerful text-based abstraction over `curl` suitable for defining suites of HTTP requests and assertions to make upon the responses.

If you're running Uesio locally, you can use `npm run tests-integration` to run all of the integration tests.

#### Running a single Integration Test

If you want to run a single integration test, you can use `npx nx run platform-integration-tests:integration <...other hurl options> <path to testfile>`, e.g.,

```bash
npx nx run platform-integration-tests:integration --very-verbose hurl_specs/allmetadata.hurl
```

If you want to run a single test and avoid having to run `npm run tests-init` prior to each test run, you can use `npx nx run platform-integration-tests:run-test <...other hurl options> <path to testfile>`, e.g.,

```bash
npx nx run platform-e2e:run-test --very-verbose hurl_specs/allmetadata.hurl
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

1. We're pinning monaco to version 0.50.0 for now because of this [bug](https://github.com/microsoft/monaco-editor/issues/4654).
   - The issue only seems to occur when running the Cypress tests (haven't been able to reproduce in a live browser when using builder) and only [builder.cy.ts](./apps/platform-e2e/cypress/e2e/builder.cy.ts) tests fail (believe this is the only test that uses the code panel but not 100% sure).
   - Given the issue is intermittent, it is likely some type of race condition either in the browser and/or in cypress.
   - Only experienced the failure on @humandad machine (2019 Intel-based MacBook Pro)which does seem to run perf tests slower than other machines so possibly the slower execution/latency is the key to encountering the issue.
   - Need to continue to monitor the monaco-editor issue along with eventually updating to cypress 14 when nx supports it (see #5 below).
2. `nx` and its plugins need to be pinned to specific versions as the version of all of them must match [per their docs](https://nx.dev/recipes/tips-n-tricks/keep-nx-versions-in-sync). Running [npx nx migrate](https://nx.dev/nx-api/nx/documents/migrate) will ensure that all are kept in-sync.
3. When running `npm install` there are errors related to `inflight@1.0.6`, `abab@2.0.6`, `glob@7.2.3`, `domexception@4.0.0` that all are dependencies of jest and its related tooling. There is a jest@next package (currently v30.0.0-alpha.6) that should address most (and hopefully) all of these. See:
   - https://github.com/jestjs/jest/issues/15173
   - https://github.com/jestjs/jest/issues/15236
   - https://github.com/jestjs/jest/issues/15325
4. Unable to update to `eslint-config-prettier` v10 due to `@nx/eslint-plugin` not supporting it yet (https://github.com/nrwl/nx/blob/master/packages/eslint-plugin/package.json#L29). See https://github.com/nrwl/nx/issues/30145.
5. Unable to update to `cypress` v14 due to `@nx/cypress` not supporting it yet (https://github.com/nrwl/nx/blob/master/packages/cypress/package.json#L47). See https://github.com/nrwl/nx/issues/30097.
