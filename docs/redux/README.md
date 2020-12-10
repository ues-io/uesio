# Uesio Redux Archetecture

## Structure

As much as possible we try to use the [Redux Toolkit](https://redux-toolkit.js.org/) and follow the best practices in the [redux style guide](https://redux.js.org/style-guide/style-guide). Any deviation from this should be clearly documented.

We follow the [Ducks pattern](https://www.freecodecamp.org/news/scaling-your-redux-app-with-ducks-6115955638be/) for the most part, but add a few more concepts.

Each "Duck" is organized into its own folder in `/src/bands`

## Bands

A band is a particular concept in Uesio that requires its own slice of the redux state. Bands should be organized in the following structure.

### index.ts

If this particular band will need a slice of the redux state, that slice should be defined in `index.ts`. The reducer for the slice should be the default export of this file.

### types.ts

### selectors.ts

### signals.ts
