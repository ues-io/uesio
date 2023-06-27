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

There are several high-level [metadata types](home) you can add in ues.io, which we'll just briefly summarize here:

-   **Data Structure and Content**:
    -   [Collections](collections): Basically, these are declarative database tables / spreadsheets. Used for structured data storage
    -   [Files](files): Static, unstructured content. Usually images, but could be textual content as well.
-   **User Interface**:
    -   [Views](views): An assembly of [components](components) and [wires](wires) that comprise an interactive user interface (often called called "pages" in other tools). Views can contain other Views, and can be accessed via Routes.
    -   [Routes](routes): The URL paths that you can use to access a View. Can contain path/query-string parameters which are sent to Views.
-   **Security & Access**:
    -   [Permission Sets](profiles-and-permission-sets): A logical grouping of access control settings, such as the ability for a user to create and edit a collection, go to a route, or view a file.
    -   [Profiles](profiles-and-permission-sets): A set of permission sets. Users can be assigned only one profile.

There's lots more, but for now, we'll just stick to these.

## Collections

Apps don't do much Without data! Fortunately, ues.io comes with a built-in multi-tenant database, which you work with by adding **collections**. On each collection, you define one or more "fields" (aka "columns" if you've used SQL before) to capture structured data of different types.

Let's start by adding a collection `animal` which we'll use for our collection manager app example.

1. Click on "Collections", then either type "n" or click on "Create new collection".
2. Enter "animal", "Animal", "Animals", and click Save.

Great! Now, we can either use "Suggest Fields" to let AI suggest fields for us, or we can manually add fields using "Create new field". Let's try out the "Suggest Fields" and see what we get:

![Suggest fields]($File{uesio/docs.suggestfieldsbutton} "use ai to suggest fields")

Cool! This is a great starting point for our collection. Let's go ahead and "Save Field Changes" to add these fields to our collection.

![Suggest fields output]($File{uesio/docs.suggestfieldsoutput} "suggested fields")

We can also add our own fields if we want, but this will do for now.

Now that we've got a collection and some fields, let's do something with it!

### Aside: Collection data

To help with building and testing apps, workspaces can have their own collection data, which is isolated just to the workspace. Once we publish the first version of our app and deploy it to a real site with real users, we'll see that the data for those sites is completely separate --- workspace collection data is just for testing of our apps.

We can manage the data in a workspace collection using the "Manage Data" button, "Import Data" from a CSV file, or even "Export Data" to a CSV. Any data / metadata you put into ues.io, you can get out!

To quickly data to a collection, though, we can use "Generate sample data", which will use some AI magic to create data matching our collection fields specification.

![Generate sample data]($File{uesio/docs.generatesampledata} "generate sample data")

![AI generated data]($File{uesio/docs.aigenerateddata} "AI generated data")

## Views

Okay, now that we've got some data, it's time to build a view to interact with it!

Click on "Views" in the sidebar.

Although we can (and often will) build Views from scratch, a fast way to get started is to use ues.io's powerful [generators](generators). Generators use templated metadata definitions to let you rapidly create metadata according to common patterns.

For Views, two super-common patterns for which ues.io provides built-in generators are:

-   **List view**: for interacting with a list of records in a collection
-   **Detail view**: for viewing/editing a single collection record

Let's use "Generate List View".

👩‍💻 **CLI** 👨🏿‍💻

> `uesio generate listview`

First, select the collection we want to use (e.g. "animals"), then pick the fields from that collection that we want to display in our list view.

![Generator params]($File{uesio/docs.listviewgeneratorparams} "list view generator params")

![list view result]($File{uesio/docs.generatedlistview} "Generated list view")

At this point, we _could_ click on our view to enter the View Builder, which is where the real magic of ues.io happens, but we'll wait on that just a bit, until we've rounded out our whirlwind tour :)

## Routes

Now that we've got a view, we need a URL path at which users can access it.

Since this is view displays a list of animals, it would be great if we could go to "/animals" in our browser to see this list, so let's create a route to make that happen.

1. Click on **Routes** in the left nav.
2. Click the **Create new route** button (or hotkey "n")
3. Enter **animals** for name and path, then select **animal_list** as the view.
4. Select the default theme.
5. Click save.

👩‍💻 **CLI** 👨🏿‍💻

> `uesio generate route`

![create route dialog]($File{uesio/docs.createroute} "Create route")

Great! Now, click **Preview**

🎉 Hurray! We've got ourselves a working app. We can create, edit, delete, and save the records in our animals collection.

![route preview]($File{uesio/docs.routepreview} "route preview")

## Conclusion

With that, we've got ourselves a working app!

Let's take a quick moment to consider everything we did _not_ have to do:

-   Write a backend API for creating, updating, and deleting data
-   Setup and configure a frontend component framework
-   Find, assemble, and/or write any UI component code
-   Write code to connect our components to our backend APIs

That's just scratching the surface. There's _so_ much more wheel that ues.io is saving us from having to reinvent, and we've barely scratched the surface of what it can do.

Now, let's talk about how to deploy this to users using sites.
