# Uesio Redux Architecture

## Structure

As much as possible we try to use the [Redux Toolkit](https://redux-toolkit.js.org/) and follow the best practices in the [redux style guide](https://redux.js.org/style-guide/style-guide). Any deviation from this should be clearly documented.

We follow the [Ducks pattern](https://www.freecodecamp.org/news/scaling-your-redux-app-with-ducks-6115955638be/) for the most part, but add a few more concepts.

Each "Duck" is organized into its own folder in `/src/bands`

## Bands

A band is a particular concept in Uesio that requires its own slice of the redux state. Bands should be organized in the following structure.

### index.ts

If this particular band will need a slice of the redux state, that slice should be defined in `index.ts`. The reducer for the slice should be the default export of this file.

### types.ts

This file describes any types that are used within this slice

### selectors.ts

Any selectors that read items from within this slice

### signals.ts

Signals that will be registered with the signals api to be run from views and components

## Redux store data structure

In contrast to the [redux style guide](https://redux.js.org/style-guide/style-guide), not only plain JavaScript objects are stored in the redux store. For example, `yaml.Document` data structure is stored in the redux store which is not a plain JavaScript object.

## Injection of the platform API into the middleware

The platform API is injected into the redux-thunk so we can easily access it upon thunk creation, while using the utility function `createAsyncThunk` of redux-toolkit. This is done by this statement, `middleware: [thunk.withExtraArgument(plat)]`. This injection is compliant with the redux style guide.
