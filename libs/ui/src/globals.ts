import * as _React from "react"
import * as _ReactDOM from "react-dom"
import * as _ReactDOMClient from "react-dom/client"
import * as _ReactDOMServer from "react-dom/server"
import * as _ReactJsxRuntime from "react/jsx-runtime"

declare global {
  // eslint-disable-next-line no-var -- we must use a var here so that the global declaration works as expected. Using let/const would cause incorrect behaviour.
  var ReactDOMClient: typeof _ReactDOMClient
  // eslint-disable-next-line no-var -- we must use a var here so that the global declaration works as expected. Using let/const would cause incorrect behaviour.
  var ReactJsxRuntime: typeof _ReactJsxRuntime
}

// Component Packs are loaded dynamically and rely on React being available in global scope.
// We could load React* in its own script tags using a UMD loader but React 19 does not ship
// UMD versions so we would have to build them ourselves or pull from a CDN.  Since we only
// need browser loads we handle it directly here instead of via separate script files.  This
// increases bundle size for uesio.js itself but not the overall "platform bundle" size.
globalThis.React = _React
globalThis.ReactDOM = _ReactDOM
globalThis.ReactDOMClient = _ReactDOMClient
globalThis.ReactDOMServer = _ReactDOMServer
globalThis.ReactJsxRuntime = _ReactJsxRuntime
