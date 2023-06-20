# Your first app

Now that you're logged in to ues.io, it's time to create your first app!

First, let's talk about we mean by "app".

## Apps

In ues.io, an App is a bundle of metadata items. An App could have a few metadata items, e.g. a custom component that you've created and want to share with other ues.io builders, or an App could have a lot of items that comprise what we traditionally think of as an "application", e.g. a recruiting management application or an employee portal, which each might have various [collections](collections), [views](views), [routes](routes), and other metadata items (which we'll discuss soon).

Each user (or organization) can create or own 1+ apps, and apps are referred to by the combination of their name and the name of the user/orgnaization who owns the app, e.g. `anna/restaurant-management`, `jose/animal-finder`.

At this point, you've already interacted with 4 different apps owned by the uesio organization:

-   `uesio/web` (ues.io's main web site)
-   `uesio/docs` (where you are right now)
-   `uesio/studio` (the app for building apps, which you are logged in to right now)
-   `uesio/io` (a pre-installed collection of components used by most apps)

Before we move on, go ahead and create your first app by clicking the + button in the top left.

![Create your first app]($File{createnewapp} "create your first app")

![New app dialog]($File{newappdialog} "new app dialog")

👩‍💻 **CLI** 👨🏿‍💻

> `uesio app init`

## Workspaces

To add metadata to an app, you need to add a **Workspace** to your app.

A Workspace is a named environment where you can make changes to an app's metadata. Workspaces are created from the ues.io Studio, and can be either long-lived or transient.

For those familiar with Git, a Workspace is similar to a Git branch. You could just have one Workspace and do all your work there, or you could have one long-lived "main" Workspace and have each team member do all of their work on short-lived "feature" Workspaces, and merge changes into the "main" workspace with Git and a continuous-integration process.

To start out though, you really just need a single Workspace, so let's go ahead and create one now.
