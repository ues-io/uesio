# Uesio Redux Architecture

## Redux Toolkit

[Redux Toolkit](https://redux-toolkit.js.org/) has been introduced in our stack at a refactoring stage.

Redux alone requires a lot of **boilerplate** and do **lack of features**. Just to mention a few :

-   manually taking care of namespacing the **action type**
-   manual coding of **action creators**
-   having **separated files** for reducer and action
-   **cloning data structures** in the reducer
-   file structure for supporting the Ducks pattern is left up to developer
-   no easy solution for [sharing state](https://redux.js.org/faq/reducers#how-do-i-share-state-between-two-reducers-do-i-have-to-use-combinereducers) between different reducers
-   rely on external libraries for having **normalizaed data** such as [Normalizr](https://github.com/paularmstrong/normalizr)

This is where Redux Toolkit - a utility library for Redux - kicks in.

## Structure

As much as possible we try to use the [Redux Toolkit](https://redux-toolkit.js.org/) and follow the best practices in the [Redux Style Guide](https://redux.js.org/style-guide/style-guide). Any deviation from this should be clearly documented.

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

## Data structure in the Redux store

In contrast to the [Redux Style Guide](https://redux.js.org/style-guide/style-guide/#use-plain-javascript-objects-for-state), not only plain JavaScript objects are stored in the redux store. The data structure `yaml.Document` - which is a class - deviates on that.

## Platform API injection

The platform API is injected into the redux-thunk so we can easily access it upon thunk creation, while using the utility function [createAsyncThunk](https://redux-toolkit.js.org/usage/usage-with-typescript#createasyncthunk) of Redux Toolkit. This is done through the `middleware` attribute, like so `middleware: [thunk.withExtraArgument(plat)]` of the config argument passed to [configureStore](https://redux-toolkit.js.org/api/configureStore).

## <a id="reducers-with-immer"></a>Reducers with Immer

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

Redux does recommend of using the built-in [generic type](https://redux.js.org/recipes/usage-with-typescript#usage-with-redux-thunk) for the action creator generating a thunk.
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

We do favour `async/await` in thunks over `Promise` for avoiding the so-called callback hell. [Redux Style Guide](https://redux.js.org/style-guide/style-guide#use-thunks-for-async-logic) does recommend using `async/await` for the sake of readability.

## A single action handled by multiple reducers

The Redux state is split into different **slices**, such as, in our stack, `viewdef`, `builder`, `route`, etc. These slices are **isolated** from each other.

However, through the concept of [extra reducer](https://redux-toolkit.js.org/api/createSlice#extrareducers) of Redux Toolkit, one single action can be dipatched to **reducers part of different slices**. In the `builder` slice you will find such use cases.

We follow the Redux Style Guide [on that matter](https://redux.js.org/style-guide/style-guide#allow-many-reducers-to-respond-to-the-same-action).

## Redux middleware

Redux-thunk is a middleware specialized in dealing with **asynchronous actions**. In order to update the Redux state, the reducer expects as payload a plain JavaScript `object` and not a `Promise`. This is where Redux-thunk comes into play.

There are plenty of different asynchronous middlewares for Redux. The most famous ones are [redux-saga](https://github.com/redux-saga/redux-saga), [redux-observable](https://github.com/redux-observable/redux-observable/) and [redux-thunk](https://github.com/reduxjs/redux-thunk). We do use redux-thunk which is the [most popular](https://www.npmtrends.com/redux-saga-vs-redux-thunk-vs-redux-observable) one. [Redux Style Guide](https://redux.js.org/style-guide/style-guide#use-thunks-for-async-logic) does recommend using that one.

## Data normalization in the Redux store

Normalizing the Redux store is recommended in the [Redux Style Guide](https://redux.js.org/style-guide/style-guide#normalize-complex-nestedrelational-state).

We use the utility [createEntityAdapter](https://redux-toolkit.js.org/api/createEntityAdapter) from Redux Toolkit for having **normalized data** in the Redux store.

For example, let the following data structure be a slice of the Redux store.

```
[
    {
        id: 343,
        title: "Learn CSS Grid",
        content: "In this post we will discuss about the..."
    },
    {
        id: 344,
        title: "Flexboxes are so handy",
        content: "A flexbox is a container whose elements..."
    }
]
```

By using the mentioned utility, the data structure become as follows :

```
{
    ids: [ 343, 344 ],
    entities: {
        343: {
            id: 343,
            title: "Learn CSS Grid",
            content: "In this post we will discuss about the..."
        },
        344: {
            id: 344,
            title: "Flexboxes are so handy",
            content: "A flexbox is a container whose elements..."
        }
    }
}
```

This conversion makes **data access** much more **efficient** in the reducers - and thereby also in the selectors -. As an example, deleting a record in the Redux store.

Here, with no normalized data, it is expensive to remove a specific record, since we must iterate through the entire collection.

```
const reducer = (state, action) => {
    if (action.type === "delete") {
        // here you need to iterate through the collection
        return state.filter( (post) => post.id !== action.payload.id )
    }
    ...
}
```

With the utility - in conjunction with [Immer](https://github.com/immerjs/immer), see [here](#reducers-with-immer) - there is no need to iterate through the entire collection.

```
const reducer = (state, action) => {
    if (action.type === "delete") {
        // here there is NO need to iterate through the collection
        delete state.entities[action.payload.id]
    }
    ...
}
```

Another argument favoring normalized data is to have a single source of truth. So if some change occur in the Redux store, the change does not need to be done at [different places](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape#normalizing-state-shape).
