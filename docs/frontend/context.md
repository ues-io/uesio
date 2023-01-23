# Context

As part of Uesio's component and signal execution runtime, Uesio maintains a stack of "context" objects, which components / signals can add "frames" to as needed.

There are a well-defined set of context frame types, with each type requiring different properties to be provided in the context options object at the time of the new frame being added.

Currently the context types (defined in `context/context.ts`) are:

    - `Error`: For adding errors into the context, for later inspection or use in notifications
    - `Field Mode`: For specifying the current mode to be used for field rendering, e.g. `EDIT` | `READ`
    - `Params`: For adding Parameters, e.g. from Routes or Views
    - `Record`: For specifying the current Wire Record in context, to be used for evaluating merges in record context
    - `Record Data`: For specifying an arbitrary set of data to be used for evaluating merges in record context even in the absence of an actual record
    - `Route`: Modified whenever you change the top-level URL route
    - `Site Admin`: Modified if a user switches into a Site Admin editing context
    - `Theme`: Defines the Theme being viewed
    - `View`: Defines the context View
    - `Wire`: Defines the context Wire
    - `Workspace`: For modifying the context Uesio workspace being worked in

Adding to the context should usually only be necessary in Uesio core code, but if you do need to add a Wire or Record context, you can do so using these methods exposed on the context object:

-   `context.addRecordFrame({ record, wire, view })`
-   `context.addWireFrame({ wire, view })`

## Context as a Stack

Contexts are generally transient, but within a given execution, e.g. running a set of Signals defined for a Button, it can be very useful to be able to access data within previous context frames to be able to resolve merges against data that was emitted from prior frames. For example, if one Signal creates a new Record in a Wire, you may want to set the value of that Record's fields to the values from a Record created in a previous context frame. Uesio enables that by retaining all prior context frames in a stack. To access previous frames explicitly, you can use `$Parent.` in merge syntax to forcibly move the merge context frame "pointer" back to the previous "parent" frame.

## Strongly-typed context frames

Each context frame is explicitly strongly-typed to enable deterministic, clear traversal and filtering of context frames, as well as type-safe addition of new context frames. As a design principle, contexts should have few properties and be strongly bound to a given use case --- rather than being "shoe-horned" in to an existing context frame type, new use cases for context should be defined in their own context frame type. Its fine to have a context frame type with just one property!
