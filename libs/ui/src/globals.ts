import * as _React from "react";
import * as _ReactDOM from "react-dom";
import * as _ReactDOMClient from "react-dom/client"
import * as _ReactDOMServer from "react-dom/server"
import * as _ReactJsxRuntime from "react/jsx-runtime"

declare global {
  // eslint-disable-next-line no-var -- we must use a var here so that the global declaration works as expected. Using let/const would cause incorrect behaviour.
  var ReactDOMClient: typeof _ReactDOMClient
  // eslint-disable-next-line no-var -- we must use a var here so that the global declaration works as expected. Using let/const would cause incorrect behaviour.
  var ReactJsxRuntime: typeof _ReactJsxRuntime
}

globalThis.React = _React;
globalThis.ReactDOM = _ReactDOM;
globalThis.ReactDOMClient = _ReactDOMClient
globalThis.ReactDOMServer = _ReactDOMServer
globalThis.ReactJsxRuntime = _ReactJsxRuntime
