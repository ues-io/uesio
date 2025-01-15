# Context

As part of Uesio's component and signal execution runtime, Uesio maintains a stack of "context" objects, which components / signals can add "frames" to as needed.

There are a well-defined set of context frame types, with each type requiring different properties to be provided in the context options object at the time of the new frame being added.

Currently the context types (defined in `context/context.ts`) are:

- `Error`: For adding errors into the context, for later inspection or use in notifications
- `Field Mode`: For specifying the current mode to be used for field rendering, e.g. `EDIT` | `READ`
- `Record`: For specifying the current Wire Record in context, to be used for evaluating merges in record context
- `Record Data`: For specifying an arbitrary set of data to be used for evaluating merges in record context even in the absence of an actual record
- `Route`: Modified whenever you change the top-level URL route
- `Signal Output`: Enables named Signals to expose their outputs for use in later Signals

- `Theme`: Defines the Theme being viewed
- `View`: Defines the context View
- `Wire`: Defines the context Wire

Some special types of context information are stored top-level on a context object, or are stored externally. These include:

- `Site Admin`: Modified if a user switches into a Site Admin editing context
- `Workspace`: When you're working in the Studio, this will contain information about the current Workspace that you're editing.
- `User`: Details about the logged-in User, such as username, email, profile picture, etc.

Adding to the context should usually only be necessary in Uesio core code, but if you do need to add a Wire or Record context, you can do so using these methods exposed on the context object:

- `context.addRecordFrame({ record, wire, view })`
- `context.addWireFrame({ wire, view })`

## Context as a Stack

Contexts are generally transient, but within a given execution, e.g. running a set of Signals defined for a Button, it can be very useful to be able to access data within previous context frames to be able to resolve merges against data that was emitted from prior frames.

For example, if one Signal creates a new Record in a Wire, you may want to set the value of that Record's fields to the values from a Record created in a previous context frame. Uesio enables that by retaining all prior context frames in a stack.

To access previous context frames _hierarchically_, you can use `$Parent.` in merge syntax to forcibly move the merge context frame "pointer" back to the previous "parent" frame.

## Strongly-typed context frames

Each context frame is explicitly strongly-typed to enable deterministic, clear traversal and filtering of context frames, as well as type-safe addition of new context frames. As a design principle, contexts should have few properties and be strongly bound to a given use case --- rather than being "shoe-horned" in to an existing context frame type, new use cases for context should be defined in their own context frame type. Its fine to have a context frame type with just one property!

## Named contexts: Signal / Component Outputs

Some types of context are referenceable by a named identifier. These include Signal Outputs and Component Outputs.

### Signal Outputs

When you define a sequence of Signals to run, for instance on a Button or in response to a Wire Event, some Signal types produce structured outputs, which it can be useful to access in subsequent steps that run other Signals. For example, when creating a new Wire Record, it is very useful to name this Record so that you can reference it in later steps. Calling a Listener Bot, likewise, may return outputs which you want to use later.

These outputs can be accessed via the following merge syntax:

`$SignalOutput{[stepId][propertyPath]}`

where

- `stepId`: the name given to the step whose Signal produced an output
- `propertyPath`: a path indicating the location you want to access within the Signal's output object.

For example, if you had a step named "convertLead" that called a "uesio/crm.convertLead" Listener Bot which returned an object of values:

```
    {
        "account": {
            "id": "abc723",
            "name": "Acme Inc.",
        }
        "opportunity": {
            "id": "006191092102",
            "name": "Acme Inc - Expansion"
        }
    }
```

you could access the "account.id" and "opportunity.id" properties, respectively, via this syntax: `$SignalOutput[convertLead][account.id]}` and `$SignalOutput[convertLead][opportunity.id]}`

### Component frames

Components can also attach arbitrary pieces of information to the context stack which are relevant to that Component using "Component Frames".

For instance, the "uesio/chart.metricgroup" Component attaches a "category" property to the context when you select a particular category, allowing you to run signals based on that category, such as navigating to a route which expects a category as a param.

Component frames can be added to a context via the following method:

```
context.addComponentFrame(componentType: string, data: object)
```

For example:

```
context.addComponentFrame("uesio/chart.metricgroup", {
    category: "manufacturing"
})
```

Subsequent signals which get run in this context can then reference this output via the following syntax:

`$ComponentOutput{[componentType][propertyPath]}`

where

- `componentType`: the component's fully-qualified type, including the user/org and the app as well as the component's name
- `propertyPath`: a path indicating the location you want to access within the data object which was attached

For example, to access the metric group's "category" property:

`$SignalOutput[uesio/chart.metricgroup][category]}`
