# Live Reload

Due to the nature of the [ues.io](https://ues.io) platform and its robust feature set, coordinating a full live reload development experience is not straightforward. Some of the complexities of a solution are:

1. Platform Module - The platform relies on other packages (e.g, `libs/app/uesio/*`) and caches them which means those assets must be (re)built prior to the platform restarting/cache clearing
2. Platform Bundles - The bundles themselves rely on the CLI module to be built which means the CLI must be (re)built prior to building the bundle
3. General - With several layers in the architecture, building everything on each change, even the smallest of changes, would negatively impact the time required to surface the change in the browser

Given the above and other complexities, a true hot module reload (HMR) solution is not possible, however a live reload solution is.

In order to accomplish, once a change is detected, any items that the changed package is dependent on must be "current" (and things its dependent on, etc.). Rather than use a manual approach to dependency detection, we rely on [Nx](https://nx.dev/) and it's project graph (which identifies each projects dependencies).

Leveraging the dependency graph of Nx, we achieve a full live reload solution in two parts:

## Platform Module Reload

This piece is responsible for monitoring the Platform module itself for changes (e.g., `*.go` files) and rebuilding/restarting the Platform (`serve` command) when detected. This piece is only responsible for platform changes and the platform process will only restart when changes are made to the platform directly. Any changes to packages the platform is dependent on (e.g., `libs/apps/uesio/*`) are monitored/handled via [Platform Dependency Reload](#platform-dependency-reload).

The [Air](https://github.com/air-verse/air) package is used to monitor and restart the Platform module. In short, instead of running the platform directly (e.g., `go run apps/platform/main.go`), Air is executed and it handles (re)starting the platform. The [configuration](../../apps/platform/.air.toml) defines what files/directories are monitored, etc.

Air is also capable of being a proxy to the platform web application which would allow it to handle not only reloading/restarting the platform when it changes but also ensuring the browser reloads when downstream dependencies change. Unfortunately, there are a couple of limitations/downsides to using Air solely for all live reload aspects:

1. Air proxy does not support SSL
2. Air would also restart the entire platform process (in addition to reloading the browser) and this has a performance impact in situations where the platform itself isn't changing. For example, when a view yaml file is changed in Studio, it would take ~5secs to ensure that Studio is built, notify Air of the change, have Air restart the process and the browser reload. By handling dependency reloads within the Platform directly (instead of via proxy), we eliminate the need to restart the platform itself thereby decreasing the total time for changes to be reflected.

One final note here is that we do not use `nx watch` on the platform itself to re-build since Air handles the platform specific rebuild/restart.

## Platform Dependency Reload

This piece is responsible for monitoring when any items the platform is dependent on have changed, rebuild them and then reload the browser. There are two parts to this solution:

1. `nx watch` is used to monitor for changes within a project and rebuild that project
2. [Reload](https://github.com/aarol/reload) package is used to monitor whenever `nx` has re-built something and inform the browser to reload (via websockets)

The process works as follows:

1. `nx watch` detects a change
2. `nx watch` runs the `build` target for the project that was changed (and any projects that the changed project relies on that need to be re-built if not already current)
3. After the project is built, the file `apps/platform/.watch/nxwatch.log` is updated with the current date (could be any change to the file, content is not important)
4. `Reload` is monitoring the `apps/platform/.watch` directory for changes and when one is detected, issues the "reload" command to the browser

See the [live reload](../../README.md#live-reload-for-development) for instructions on the various ways to run live reload.
