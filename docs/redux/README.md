# Uesio Redux Architecture

## Redux Toolkit

We introduced [Redux Toolkit](https://redux-toolkit.js.org/) in our stack upon a code refactoring.

Redux alone requires a lot of boilerplate such as manual coding of the action type and action creators, having separate files for reducer and action as well as cloning objects in the reducers.
This is where Redux Toolkit kicks in.

## Structure

As much as possible we try to use the [Redux Toolkit](https://redux-toolkit.js.org/) and follow the best practices in the [redux style guide](https://redux.js.org/style-guide/style-guide). Any deviation from this should be clearly documented.

We follow the [Ducks pattern](https://www.freecodecamp.org/news/scaling-your-redux-app-with-ducks-6115955638be/) for the most part, but add a few more concepts.

Each "Duck" is organized into its own folder in `/src/bands`.

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

## Platform API injection

The platform API is injected into the redux-thunk so we can easily access it upon thunk creation, while using the utility function [createAsyncThunk](https://redux-toolkit.js.org/usage/usage-with-typescript#createasyncthunk) of [Redux Toolkit](https://redux-toolkit.js.org/). This is done through the `middleware` attribute, like so `middleware: [thunk.withExtraArgument(plat)]` of the argument passed to [configureStore](https://redux-toolkit.js.org/api/configureStore).

## Reducer is a pure function

Redux [enforces](https://redux.js.org/understanding/thinking-in-redux/glossary#reducer) the reducers to be pure functions.

[Redux Toolkit](https://redux-toolkit.js.org/api/createReducer#direct-state-mutation) complies with that by using [Immer](https://github.com/immerjs/immer) in the reducers. So, even if the code may look like of having **side-effects**, there are no such things.

## Action creator with TypesScript

As a reminder, an **action creator** is a function generating either a plain object, called an **action**, like so :

```
{
    type: "user/fetch",
    payload: {
        first: "Simon",
        last: "Lebon",
    }
}
```

or a function, called a **thunk**, like so :

```
(dispatch) => {
    fetch("http://example.com/users/19")
    .then((response) => response.json())
    .then((response) => dispatch(makeUser(response)))
}
// or using async/await
async (dispatch) => {
    const userPromise = await fetch("http://example.com/users/19");
    const userParsed = await userPromise.json();
    dispatch(makeUser(userParsed));
}
```

The thunk will be called by the middleware. In our stack we do use [redux-thunk](https://github.com/reduxjs/redux-thunk).

Redux does recommend of using the [built-in type](https://redux.js.org/recipes/usage-with-typescript#usage-with-redux-thunk) `ThunkAction` for the action creator generating a thunk.
By doing that, there is no need to individually type the arguments of the thunk. See the snippet below.

```diff
- (context: Context, wirename: string) => async (
-	dispatch: Dispatcher<AnyAction>,
-	getState: () => RuntimeState
+ (context: Context, wirename: string): ThunkFunc => async (
+	dispatch,
+	getState
) => {
    // body of the thunk here
}
```
