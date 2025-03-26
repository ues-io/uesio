import { useEffect } from "react"
import { useRoute } from "../bands/route/selectors"
import Progress from "./progress"
import { ViewArea } from "../components/view"
import { useSite } from "../bands/site"
import { Context } from "../context/context"
import {
  getRouteUrlPrefix,
  navigate,
  redirect,
} from "../bands/route/operations"
import NotificationArea from "./notificationarea"
import { Component } from "../component/component"
import { makeViewId } from "../bands/view"
import { UtilityComponent } from "../definition/definition"
import { setupStyles } from "../styles/styles"

// This is a hack to get webfonts to show up in safari
// after they've been loaded. I've tried a bunch of different things,
// including different font-display: swap,block,optional,etc to no avail.
// All this code does is cause the browser to repaint after a while.

// https://stackoverflow.com/a/23522755 -- isSafari code
const isSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

const repaintSafari = () => {
  document.documentElement.style.display = "none"
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  document.documentElement.offsetHeight
  document.documentElement.style.display = ""
}

if (isSafari()) {
  // I realize this is super dumb. But i've tried all kinds of things to get
  // safari to work correctly from FontFaceObserver, to the font-display property.
  // The issue is that if the font isn't "used" in the initial html markup in safari,
  // the browser isn't notified that the font has loaded.

  // It would be nice to be able to figure out if we were successful in loading
  // the font and cancel the rest of these.
  window.setTimeout(repaintSafari, 100)
  window.setTimeout(repaintSafari, 500)
  window.setTimeout(repaintSafari, 1000)
  window.setTimeout(repaintSafari, 2000)
  window.setTimeout(repaintSafari, 4000)
}
// End hack

const Route: UtilityComponent = (props) => {
  const site = useSite()
  const route = useRoute()

  useEffect(() => {
    if (!route) return
    const { namespace, path, workspace, params } = route
    // This makes sure that the namespace and path of the route is specified in the history.
    window.history.replaceState(
      {
        namespace,
        path,
        workspace,
        params,
      },
      "",
      path
        ? getRouteUrlPrefix(routeContext, namespace) +
            path +
            window.location.search
        : undefined,
    )
    // We only want this hook to fire once (when this route component was first mounted)
    // If it fires when the route changes, then we're just overwriting the changes we made
    // in the navigate operation (with pushState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    window.onpopstate = (event: PopStateEvent) => {
      const { workspace, namespace, title, tags, params } = event.state
      let { path } = event.state

      if (!path || !namespace) {
        // In some cases, our path and namespace aren't available in the history state.
        // If that is the case, then just punt and do a plain redirect.
        redirect(new Context(), document.location.pathname)
        return
      }

      let navigateContext = new Context()
      if (workspace) navigateContext = navigateContext.setWorkspace(workspace)
      if (site) navigateContext = navigateContext.setSite(site)

      // If there are params in the route, then we need to add them to our path,
      // as long as our path doesn't already have a ? in it.
      if (params && path.indexOf("?") === -1) {
        path = `${path}?${new URLSearchParams(params).toString()}`
      }

      navigate(
        navigateContext,
        {
          path,
          namespace,
          title,
          tags,
        },
        true,
      )
    }
  }, [site])

  // Quit rendering early if we don't have our route yet
  if (!route) return null

  const { workspace, params, theme } = route
  const viewId = route.view

  let routeContext = props.context.addRouteFrame({
    route,
    viewDef: viewId,
    theme,
    view: makeViewId(props.context, viewId),
  })

  setupStyles(routeContext)

  if (workspace) {
    routeContext = routeContext.setWorkspace(workspace)
  }

  if (site) {
    routeContext = routeContext.setSite(site)
  }

  return (
    <>
      {workspace ? (
        <Component
          context={routeContext}
          componentType={workspace.wrapper}
          path=""
          definition={{
            view: viewId,
            params,
          }}
        />
      ) : (
        <ViewArea
          context={routeContext}
          definition={{
            view: viewId,
            params,
          }}
          path=""
        />
      )}
      <Progress context={routeContext} />
      <NotificationArea context={routeContext} />
    </>
  )
}

Route.displayName = "Route"

export default Route
