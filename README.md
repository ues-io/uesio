# About Uesio

![Uesio Logo](./libs/uesioapps/uesio/bundle/files/logo.png)

Uesio is a **low-code** application development platform.

# Code style

Our code styling is embeded in various [eslint](https://eslint.org/) rules.

We use the repo called [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) for having `eslint` working along with TypeScript. This repo is an alternaltive to the [TSLint](https://github.com/palantir/tslint) project which is no longer supported.

[Prettier](https://prettier.io/) is used for **formatting** our source code.

# Tech Stack

## Backend

- [Cobra](https://github.com/spf13/cobra). CLI for Go application.
- [gorilla/mux](https://github.com/gorilla/mux). Web framework in Go.
- [Package template](https://golang.org/pkg/text/template/). Template for rendering HTML by the Go web server.
- [squirrel](https://github.com/Masterminds/squirrel). Go library for generating SQL query.
- [goja](https://github.com/dop251/goja). JavaScript engine implemented in Go.

## Frontend

- [TypeScript](https://www.typescriptlang.org/). Wrapper over JavaScript.
- [webpack](https://webpack.js.org/). Merge code source into one single static file.
- [ts-loader](https://github.com/TypeStrong/ts-loader). Compilation TypeScript down to JavaScript as a webpack plugin.
- [React](https://reactjs.org/). Library for making UI elements.
- [Redux](https://redux.js.org/). State mangement system for web application.
- [Redux Thunk](https://github.com/reduxjs/redux-thunk). Middleware for Redux, for handling asynchronous redux-actions.

# Monorepo architecture

The present monorepo hosts several standalone **applications**, such as the `cli`.

Sandalone **libraries** are located in the `libs` folder. These libs are components of the applications or container for sharing code between applications and libs, such as the `constants` lib.

The monorepo is managed by a tool called [nx](https://nx.dev/).
`nx` has the particularity of having one single `package.json` for the whole monorepo.

The `workspace.json` file holds the configuration on how each application and lib should be built, tested, linted. `nx.json` holds the configuration on dependency of apps/libs - esp. for the build process.

For scaffolding a new lib, you can run the following script.

```
nx g @nrwl/workspace:library NEW_LIB
```

# Set up dev environment

- Install [homebrew](https://brew.sh/) (for macOS user)
- Install git

- Install [nvm](https://github.com/nvm-sh/nvm) (Node.js and npm)
- Install [Go](https://golang.org/dl/)
- Install [VS Code](https://code.visualstudio.com/Download) and plugins (ESLint, Prettier, Go, GitLens). Do enable `format on save` in conjunction with the `Prettier`.

- git clone repo (ssh method is prefered)
- Download and install the npm module dependencies :

```
  npm install
```

- Build the monorepo :

```
  npm run build-all
```

- Optional. If you'd like to work with firestore on your local machine, do follow the instructions [here](#local-firestore).
- Optional. Install [Oh My Zsh](https://ohmyz.sh/)
- Optional. [Add a SSH key to your github account](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- Optional. Install [iTerm2](https://www.iterm2.com/) (for macOS user)
- Optional. Install the `nx` cli globally.
  ```
  npm install -g nx
  ```
- Optional. Mock data for the CRM uesio app :
  ```
   cd ./libs/uesioapps/crm && ../../../apps/cli/bin/run upsert -f data/contacts.csv -c crm.contacts
  ```
- Optional. Create a file called `launch.json` located in `apps/.vscode` for the uesio server debugger in Go and paste the following :

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

The build process is done either by `webpack`, or our own `cli` or `go build` or the TypeScript compiler aka `tsc` depending on the application/library.

## Build all applications and libs

```
npm run build-all
```

## Build a dedicated app (no watcher and no source map)

```
cd ./libs/uesioapps/crm && ../../../apps/cli/bin/run pack
```

or

```
npm run nx -- build uesioapps-crm
```

or (if you have `nx` install globally)

```
nx build uesioapps-crm
```

## Build a dedicated app (with watcher and source map)

On the frontend, the `source map` is enabled in webpack in `dev` mode. While developping you might want to rebuild on saving with the source map in the browser :

```
cd ./libs/uesioapps/uesio && ../../../apps/cli/bin/run pack --develop
```

# Uesio apps deployment

**Uesio apps** such as the **uesio crm** are applications which can be plugged into the uesio system. These uesio apps are located in the `uesioapps` directory which is located under the `libs` folder.

For plugging such an application into uesio, you have to deploy it obviously after having built it. This deployment process is done by the `cli`.

```
cd ./libs/uesioapps/crm && ../../../apps/cli/bin/run deploy
```

Remark. The `uesio` lib under `uesioapps` does not need to be deployed. The backend is directly accessing the related files part of that lib.

An **app bundle** is a screenshot or version of a specific uesio app.

# Set up SSL

```
npm run setup-ssl
```

This script should create the `certificate.crt` and `private.key` files in the `apps/platform/ssl` directory. You will need to configure your operating system to trust this self-signed certificate.

In windows, double-click certificate.crt in the File Explorer. Click "Install Certificate..." Then place the certificate in the "Trusted Root Certification Authorities".

In mac, double-click certificate.crt in Finder. Right-click on the uesio-dev.com certificate and select "Get Info". Expand the "Trust" section and set it to "Always Trust".

# Set up DNS

On Mac modify the `/etc/hosts` file to include the following lines

```
127.0.0.1 uesio-dev.com
127.0.0.1 studio.uesio-dev.com
127.0.0.1 www.uesio-dev.com
```

Mac users can also use a service called dnsmasq for managing local DNS, but that has not been documented yet.

# Environment Variables

| Environment Variable         | Description                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| UESIO_USE_HTTPS              | Use ssl or not                                                                             |
| GOOGLE_CLOUD_PROJECT         | Google Cloud project ID                                                                    |
| GOOGLE_AUTH_CLIENT_ID        | Client Id for Google Auth                                                                  |
| GOOGLE_CLOUD_API_KEY         | (Not needed for emulator use) The stringified JSON content of the application credentials  |
|                              | (https://cloud.google.com/firestore/docs/quickstart-servers#set_up_authentication)         |
| FIRESTORE_EMULATOR_HOST      | Emulator host and port                                                                     |
| FACEBOOK_APP_ID              | Facebook APP ID                                                                            |
| UESIO_SESSION_STORE          | Allows you to specify a storage location for user sessions.                                |
| UESIO_PLATFORM_BUCKET        | The Bucket in GCP file uploads will be populated to if using the useio.platform filesource |
|                              | (Can be either empty, or "filesystem" if you want sessions to persist)                     |
| UESIO_ALLOW_INSECURE_COOKIES | Allows cookies without the secure flag (Useful in local docker envirnments)                |
| UESIO_LOCAL_FILES            | Set to "true" to have the uesio.platform filesource save files to the file system          |
| COGNITO_CLIENT_ID            | Client Id for a Cognito Pool Device                                                        |
| COGNITO_POOL_ID              | Pool Id for a Cognito Pool                                                                 |
| AWS_ACCESS_KEY_ID            | AWS access key for DynamoDB                                                                |
| AWS_SECRET_ACCESS_KEY        | AWS SECRET access key for DyanamoDB                                                        |
| AWS_REGION                   | The region where the DyanamoDB is located                                                  |

# Seed Local Database with Test Data

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

# <a id="local-firestore"></a> Local Development with the Firestore Emulator

1. Create a project in the [firebase console](https://console.firebase.google.com/).

2. ```
   npm install -g firebase-tools
   ```

3. Select the project your created before, while interacting with the firebase cli.

```
   firebase init firestore
```

4. ```
   firebase emulators:start
   ```

5. In a browser visit

```
   http://localhost:4000/firestore/

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

4. Optional. Stop the container (which is as a normal process) when no need to have it running.

```
docker stop CONTAINER_NAME
```

5. Optional. Start an existing container

```
docker start CONTAINER_NAME
```

6. Optional. Remove the docker container when no longer needed.

```
docker rm -f CONTAINER_NAME
```

# Connecting to a real Firestore instance

1. First set up your google cloud SDK and your first project (see above)
2. Initialize Firestore to be "Native Firestore"
3. Follow the steps laid out here to get a application credentials json file.
   https://cloud.google.com/firestore/docs/quickstart-servers#set_up_authentication
4. Place this JSON content of this file in the GOOGLE_CLOUD_API_KEY environment variable wrapped in `''`, example: `export GOOGLE_CLOUD_API_KEY='{ JSON CONTENT }'`
5. Make sure that the FIRESTORE_EMULATOR_HOST variable is either an empty string or not set.
6. `firebase emulators:start`
7. Try to run seeds
8. If seeds were successful - enjoy your cloud based firestore instance.

```

```

```

```

```

```

```

```

```

```
