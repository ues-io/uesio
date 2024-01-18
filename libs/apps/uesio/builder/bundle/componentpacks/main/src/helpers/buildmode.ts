import { api, context } from "@uesio/ui"

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
		path ? path + window.location.search : undefined
	)
	document.title = title
}

const toggleBuildMode = (
	ctx: context.Context,
	setBuildMode: (state: boolean) => void,
	buildMode: boolean
) => {
	api.builder.getBuilderDeps(ctx).then(() => {
		swapEditAndPreviewMode(ctx, !!buildMode)
		setBuildMode(!buildMode)
	})
}

export { toggleBuildMode }
