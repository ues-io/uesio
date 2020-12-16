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

In contrast to the [redux style guide](https://redux.js.org/style-guide/style-guide/#use-plain-javascript-objects-for-state), not only plain JavaScript objects are stored in the redux store. `yaml.Document` data structure deviates on that.

## Injection of the platform API into the middleware

The platform API is injected into the redux-thunk so we can easily access it upon thunk creation, while using the utility function [createAsyncThunk](https://redux-toolkit.js.org/usage/usage-with-typescript#createasyncthunk) of [Redux Toolkit](https://redux-toolkit.js.org/). This is done through the field `middleware`, like so `middleware: [thunk.withExtraArgument(plat)]` of the argument passed to [configureStore](https://redux-toolkit.js.org/api/configureStore). This injection is compliant with the [redux style guide](https://redux.js.org/style-guide/style-guide).

## Reducers are pure function

The [redux style guide](https://redux.js.org/style-guide/style-guide/#reducers-must-not-have-side-effects) enforces the reducers to be pure functions. [Redux Toolkit](https://redux-toolkit.js.org/api/createReducer#direct-state-mutation) complies with that by using [Immer](https://github.com/immerjs/immer) in the reducers. So, even if the code may look like having side-effects, there are no such things.
