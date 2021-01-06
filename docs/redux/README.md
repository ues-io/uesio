# Uesio Redux Architecture

## Redux Toolkit

We introduced [Redux Toolkit](https://redux-toolkit.js.org/) in our stack upon a code refactoring.

Redux alone requires a lot of **boilerplate** such as manual coding of the **action type** and **action creators**, having **separate files** for reducer and action as well as the **cloning data structures** in the reducers.
This is where Redux Toolkit - a utility library for Redux - kicks in.

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

In contrast to the [redux style guide](https://redux.js.org/style-guide/style-guide/#use-plain-javascript-objects-for-state), not only plain JavaScript objects are stored in the redux store. The data structure `yaml.Document` - which is a class - deviates on that.

## Platform API injection

The platform API is injected into the redux-thunk so we can easily access it upon thunk creation, while using the utility function [createAsyncThunk](https://redux-toolkit.js.org/usage/usage-with-typescript#createasyncthunk) of Redux Toolkit. This is done through the `middleware` attribute, like so `middleware: [thunk.withExtraArgument(plat)]` of the config argument passed to [configureStore](https://redux-toolkit.js.org/api/configureStore).

## Reducers with Immer

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

As a side note, even if the two thunks in the snippet above are equivalent, pay attention to the **retuned value**. The first thunk written with a promise returns `void` while the second one, written in `async/await` manner, returns a `Promise`.

The thunk will be called by the middleware. In our stack we do use [redux-thunk](https://github.com/reduxjs/redux-thunk).

Redux does recommend of using the [built-in generic type](https://redux.js.org/recipes/usage-with-typescript#usage-with-redux-thunk) for the action creator generating a thunk.
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

## Promise vs async/await

We do favour `async/await` in thunks over `Promise` for avoiding the so-called callback hell. [Redux Toolkit](https://redux-toolkit.js.org/usage/usage-guide#using-middleware-to-enable-async-logic) does recommend using `async/await` for the sake of readability.

## Custom middlewares

When actions need to be synchronized with each other, the middleware comes into play. A middleware is curried function like so:

```
(store) => (next) => (action) => {
    // body of the middleware here

    // next(action)
}
```

From this snippet we can see that a middleware is a function decorating another middleware and so on recursively.

In our stack we do have some custom middlewares for listening to specific actions and dispatch another action, once the first one has hit the reducer.

## Redux-thunk middleware

The Redux-thunk middleware is in charge of dealing with asynchronous actions. Indeed the reducer expects as parameter a plain `JavaScript object` and not a `Promise`.

There are plenty of different middlewares for Redux. The most famous ones are [redux-saga](https://github.com/redux-saga/redux-saga), [redux-observable](https://github.com/redux-observable/redux-observable/) and [redux-thunk](https://github.com/reduxjs/redux-thunk). We do use redux-thunk which is the [most popular](https://www.npmtrends.com/redux-saga-vs-redux-thunk-vs-redux-observable) one. [Redux Toolkit](https://redux-toolkit.js.org/usage/usage-guide#using-middleware-to-enable-async-logic) does recommend using that one.
