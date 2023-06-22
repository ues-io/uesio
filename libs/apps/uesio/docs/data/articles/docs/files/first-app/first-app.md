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

![Create your first app]($File{uesio/docs.createnewapp} "create your first app")

![New app dialog]($File{uesio/docs.newappdialog} "new app dialog")

👩‍💻 **CLI** 👨🏿‍💻

> `uesio app init`

## Workspaces

To add metadata to an app, you need to add a **workspace** to your app.

A workspace is a named environment where you can make changes to an app's metadata. workspaces are created from the ues.io Studio, and can be either long-lived or transient.

For those familiar with Git, a workspace is similar to a Git branch. You could just have one workspace and do all your work there, or you could have one long-lived "main" workspace and have each team member do all of their work on short-lived "feature" workspaces, and merge changes into the "main" workspace with Git and a continuous-integration process.

To start out though, you really just need a single workspace, so let's go ahead and create one now.

Click the + button in the top left to create a workspace. Try "dev" as the name.

## Collections, views, and routes

Now that you've got a workspace, it's time to add some metadata to your app!

There are several high-level [metadata types](metadata-types/home) you can add in ues.io, which we'll just briefly summarize here:

-   **Data Structure and Content**:
    -   [Collections](metadata-types/collections): Basically, these are declarative database tables / spreadsheets. Used for structured data storage
    -   [Files](metadata-types/files): Static, unstructured content. Usually images, but could be textual content as well.
-   **User Interface**:
    -   [Views](metadata-types/views): An assembly of [components](metadata-types/components) and [wires](concepts/wires) that comprise an interactive user interface (often called called "pages" in other tools). Views can contain other Views, and can be accessed via Routes.
    -   [Routes](metadata-types/routes): The URL paths that you can use to access a View. Can contain path/query-string parameters which are sent to Views.
-   **Security & Access**:
    -   [Permission Sets](metadata-types/profiles-and-permission-sets): A logical grouping of access control settings, such as the ability for a user to create and edit a collection, go to a route, or view a file.
    -   [Profiles](metadata-types/profiles-and-permission-sets): A set of permission sets. Users can be assigned only one profile.

There's lots more, but for now, we'll just stick to these.

## Collections

Apps don't do much Without data! Fortunately, ues.io comes with a built-in multi-tenant database, which you work with by adding **collections**. On each collection, you define one or more "fields" (aka "columns" if you've used SQL before) to capture structured data of different types.

Let's start by adding a collection `animal` which we'll use for our collection manager app example.

1. Click on "Collections", then either type "n" or click on "Create new collection".
2. Enter "animal", "Animal", "Animals", and click Save.

Great! Now, we can either use "Suggest Fields" to let AI suggest fields for us, or we can manually add fields using "Create new field". Let's try out the Suggest Fields and see what we get:

We can do this repeatedly
