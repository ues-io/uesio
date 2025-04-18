import { api, context } from "@uesio/ui"
import { getBuilderExternalState } from "../api/stateapi"

const editPath = "/edit"
const previewPath = "/preview"

// if we are in "View" edit or preview mode, update the URL and document title
// to be in sync with the current build mode
const swapEditAndPreviewMode = (ctx: context.Context, buildMode: boolean) => {
  const route = ctx.getRoute()
  if (!route) {
    return
  }
  const { namespace, workspace, params } = route
  let title = document.title
  let path = window.location.pathname
  // We only want to change the URL if we are in "View" edit or preview mode,
  // as opposed to "Route" preview mode
  if (!path.includes(editPath) && !path.includes(previewPath)) {
    return
  }
  if (buildMode) {
    path = path.replace(editPath, previewPath)
    title = title.replace("Edit", "Preview")
  } else {
    path = path.replace(previewPath, editPath)
    title = title.replace("Preview", "Edit")
  }
  window.history.replaceState(
    {
      namespace,
      path,
      workspace,
      params,
    },
    "",
    path ? path + window.location.search : undefined,
  )
  document.title = title
}

const toggleBuildMode = async (
  ctx: context.Context,
  setBuildMode: (state: boolean) => void,
  buildMode: boolean,
) => {
  // check if we've already loaded the builder dependencies
  // TODO: This should likely come from state rather than a component that we
  // know won't be loaded in "preview" mode
  const isLoaded = !!getBuilderExternalState(ctx, "indexpanel")
  if (!isLoaded) {
    await api.builder.getBuilderDeps(ctx)
  }
  swapEditAndPreviewMode(ctx, !!buildMode)
  setBuildMode(!buildMode)
}

export { toggleBuildMode }
