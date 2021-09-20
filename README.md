# About Uesio

![Uesio Logo](./libs/uesioapps/uesio/bundle/files/uesio.logo/file/uesioblack.png)

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
-   [Package template](https://golang.org/pkg/text/template/). Template for rendering HTML by the Go web server.
-   [squirrel](https://github.com/Masterminds/squirrel). Go library for generating SQL query.
-   [goja](https://github.com/dop251/goja). JavaScript engine implemented in Go.

## Frontend

-   [Node.js](https://www.nodejs.org/). For package management, building process, for development and for our home-made cli application.
-   [TypeScript](https://www.typescriptlang.org/). Wrapper around JavaScript.
-   [webpack](https://webpack.js.org/). Merge code source into one single static file.
-   [ts-loader](https://github.com/TypeStrong/ts-loader). Compilation TypeScript down to JavaScript as a webpack plugin.
-   [React](https://reactjs.org/). Library for making UI elements.
-   [Redux](https://redux.js.org/). Single source of truth for the entire application's data.
-   [Redux-toolkit](https://redux-toolkit.js.org/). Bootstrap for Redux.
-   [Redux Thunk](https://github.com/reduxjs/redux-thunk). Middleware for Redux, for handling asynchronous redux-actions.

# <a id="redux-architecture"></a> Redux architecture

See the [Uesio Specific Redux Docs](./docs/redux/README.md) on that matter.

# <a id="monorepo-structure"></a> Monorepo structure

The present monorepo hosts several standalone **applications**, such as the `cli`.

Sandalone **libraries** are located in the `libs` folder. These libs are components of the applications or container for sharing code between applications and libs.

The monorepo is managed by a tool called [nx](https://nx.dev/).
`nx` has the particularity of having one single `package.json` for the whole monorepo.

The `workspace.json` is the entry point for the **build**, **watcher**, **test**, **linting** processes for the whole monorepo. `nx.json` holds the configuration on dependency of apps/libs - esp. for the build process.

For scaffolding a new lib, you can run the following script.

```
nx g @nrwl/workspace:library NEW_LIB
```

# Set up dev environment

-   Install [homebrew](https://brew.sh/) (for macOS user)
-   Install git
-   Install GitHub Desktop [GitHub Desktop](https://desktop.github.com/)
-   ```
    brew install wget
    ```
-   Install [nvm](https://github.com/nvm-sh/nvm) (for installing Node.js and npm)
-   Install the latest version of Node.js _via_ `nvm` :

```
  nvm install node
```

-   Install [Go](https://golang.org/dl/)
-   Install [VS Code](https://code.visualstudio.com/Download) and plugins (ESLint, Prettier, Go, GitLens). Do enable `format on save` in conjunction with the `Prettier`. Set up the `code` [environment variable](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line).
-   Install the following [Google Chrome plugins](https://chrome.google.com/webstore) : `React Developers Tools`, `Redux DevTools`.
-   _Optional_. Install [Oh My Zsh](https://ohmyz.sh/)
-   _Optional_. [Add a SSH key to your github account](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
-   _Optional_. Install the `nx` cli globally.

    ```
    npm install -g nx
    ```

-   Use Git clone and store this repository in your local machine
-   Do follow the instructions for setting up SSL [here](#set-up-ssl).
-   Do follow the instructions for environment variables [here](#environment-variables).
-   Do follow the instructions for setting up DNS [here](#set-up-local-dns).
-   Create an alias in your terminal, this will help to execute Uesio commands.

    ```
    alias uesio=“npm run uesio”
    ```

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

# CLI .uesio file Setup

Uesio has a CLI that requires a .uesio file in your home directory. It is formatted like so:

```
{"sessionId":"Xhv-LoI9VaEtxUnfuedUWKtX","workspaceId":"dev","appId":"crm"}
```

If you are starting on a fresh machine, you can supply the workspaceId and appId that you care about, and the CLI will run you through a login process and grab the sessionId and save it during the first command you attempt to execute.

# Build

The build process is done either by `webpack`, or our own `cli` or `go build` or the TypeScript compiler aka `tsc` depending on the application/library.

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
cd ./libs/uesioapps/crm && uesio pack

// or
npm run nx -- build uesioapps-crm

// or, if you have nx globally
nx build uesioapps-crm
```

## Build a dedicated app (with watcher and source map)

On the frontend, the `source map` is enabled in webpack in `dev` mode. While developping you might want to rebuild on saving with the source map in the browser :

```
cd ./libs/uesioapps/uesio && uesio pack --develop
```

# Watch mode

While developping you may want the entire monorepo to rebuild upon file saving.

```
npm run watch-all

// terminating that script does not kill
// the watcher jobs running in background in parallel.
// For killing all of them, do run `killall node`
```

As a side note, the `dev` npm script does include this `watch-all` npm script.

# Uesio apps deployment

**Uesio apps** such as the **uesio crm** are applications which can be plugged into the uesio system. These uesio apps are located in the `uesioapps` directory which is located under the `libs` folder.

For plugging such an application into uesio, you have to deploy it, **obviously after having built it**. This deployment process is done by the `cli`.

```
cd ./libs/uesioapps/crm && uesio deploy

// or
npm run nx -- deploy uesioapps-crm

// or, if you have nx globally
nx deploy uesioapps-crm
```

The `uesio` lib under `uesioapps` does **not** need to be **deployed**. The backend is directly accessing the related files part of that lib.

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

On Mac modify the `/etc/hosts` file to include the following lines

```
127.0.0.1 uesio-dev.com
127.0.0.1 studio.uesio-dev.com
127.0.0.1 www.uesio-dev.com
127.0.0.1 docs.uesio-dev.com
127.0.0.1 www.docs.uesio-dev.com
```

Mac users can also use a service called dnsmasq for managing local DNS.

```
brew install dnsmasq
```

The installation process will output several commands that you can use to start Dnsmasq automatically with a default configuration. I used the following commands but you should use whichever commands brew tells you to:

```
sudo brew services start dnsmasq
```

# <a id="environment-variables"></a> Environment Variables

Do define the following environment variables in `~/.zshenv`. (If you are using Oh My Zsh)

| Environment Variable         | Description                                                                                | Examples, Values & Help                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| UESIO_USE_HTTPS              | Use ssl or not                                                                             | true or false                                                                           |
| GOOGLE_CLOUD_PROJECT         | Google Cloud project ID                                                                    | test-cf94a                                                                              |
| GOOGLE_CLOUD_API_KEY         | (Not needed for emulator use) The stringified JSON content of the application credentials  | (https://cloud.google.com/firestore/docs/quickstart-servers#set_up_authentication)      |
| UESIO_SESSION_STORE          | Allows you to specify a storage location for user sessions.                                | filesystem or "" (Can be either empty, or "filesystem" if you want sessions to persist) |
| UESIO_PLATFORM_BUCKET        | The Bucket in GCP file uploads will be populated to if using the useio.platform filesource |                                                                                         |
| UESIO_ALLOW_INSECURE_COOKIES | Allows cookies without the secure flag (Useful in local docker envirnments)                | true                                                                                    |
| UESIO_LOCAL_FILES            | Set to "true" to have the uesio.platform filesource save files to the file system          | true                                                                                    |
| UESIO_MOCK_AUTH              | Allows the use of mocked users                                                             | true                                                                                    |
| COGNITO_CLIENT_ID            | Client Id for a Cognito Pool Device                                                        |                                                                                         |
| COGNITO_POOL_ID              | Pool Id for a Cognito Pool                                                                 |                                                                                         |
| GOOGLE_CLIENT_ID             | Client ID for Google Sign In                                                               |

# Seed Local Database with Test Data

This creates test data & the basic data Uesio needs to start in you database.

```
npm run nx -- seed platform
```

# Run the application Locally

```
npm run nx -- serve platform
```

In a browser visit

```
https://uesio-dev.com:3000
```

# Local Development with a database in Docker

0. Install [Docker Desktop](https://docs.docker.com/desktop/)
1. Create a **docker container** based on a remote docker **image** - _e_._g_. `mysql`. - and tag a `CONTAINER_NAME` - _e_._g_. `mysql-container-uesio`.

```
  docker run --name mysql-container-uesio -p 3306:3306 -e MYSQL_ROOT_PASSWORD=tcm -d mysql
```

2. Check if your container is up and running. You have information about the container **id** and **name**.

```
  docker ps
```

3. Get in the container and create a database.

```
  docker exec -it CONTAINER_NAME /bin/bash
```

```
  ./usr/bin/mysql --user=root --password=tcm
```

```
  CREATE DATABASE `test-cf94a`;
```

4. _Optional_. Stop the container (which is as a normal process) when no need to have it running.

```
  docker stop CONTAINER_NAME
```

5. _Optional_. Start an existing container

```
  docker start CONTAINER_NAME
```

6. _Optional_. Remove the docker container when no longer needed.

```
  docker rm -f CONTAINER_NAME
```

# npm dependencies

As mentioned in the [monorepo](#monorepo-structure) section, a single `package.json` file describes the npm dependencies for the whole monorepo.

All npm modules we used are installed as `development` dependency since uesio is not intended to be realeased as standalone npm module.

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

# Running postgres locally

```
docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
```
